import { writeFileSync } from 'fs'
import { createServer } from 'http'
import isEqual = require('lodash.isequal')
import { basename, isAbsolute, join } from 'path'
import { sync } from 'resolve'
import * as tempy from 'tempy'
import { CompilerOptions } from 'typescript'
import { Stats } from 'webpack'
import { createIndexHtml } from '../browser/createIndexHtml'
import { findOpenPort } from '../browser/findOpenPort'
import { generateTestBundle } from '../browser/generateTestBundle'
import { getLauncher, openBrowser } from '../browser/openBrowser'
import { setupServer } from '../browser/server'
import { watchFile } from '../browser/webpack/watchFile'
import { collectByKey } from '../common/collectByKey'
import { makeAbsolute } from '../common/makeAbsolute'
import { getTestResults, getTestStats } from '../results'
import { watchTestMetadata } from '../tests/watchTestMetadata'
import { Logger, TestMetadata } from '../types'
import { ProcessResults, typecheckInAnotherProcess } from '../typescript/typeCheckInAnotherProcess'
import { Results } from './Results'
import { StatsAndResults, TypedTestOptions } from './types'

const uniq = <A>(list: A[]): A[] => Array.from(new Set(list))
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const updateQueue = (metadata: TestMetadata[], queue: TestMetadata[]) => {
  const queuedMetadataByFilePath = collectByKey(x => x.filePath, queue)
  const queuedFilePaths = Object.keys(queuedMetadataByFilePath).sort()
  const metadataByFilePath = collectByKey(x => x.filePath, metadata)
  const filePaths = Object.keys(metadataByFilePath).sort()
  const allFilePaths = uniq([...filePaths, ...queuedFilePaths])

  return allFilePaths.reduce(
    (xs, filePath) =>
      metadataByFilePath[filePath] // replace updated files
        ? xs.concat(metadataByFilePath[filePath])
        : xs.concat(queuedMetadataByFilePath[filePath]),
    [] as TestMetadata[],
  )
}

export async function watchBrowserTests(
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  options: TypedTestOptions,
  cwd: string,
  logger: Logger,
  cb: (results: StatsAndResults) => void,
  errCb: (error: Error) => void,
  typeCheckCb: (results: ProcessResults) => void,
) {
  const { keepAlive, timeout, typeCheck, mode } = options
  const outputDirectory = tempy.directory()
  const temporaryPath = join(outputDirectory, basename(tempy.file({ extension: 'ts' })))
  const bundlePath = join(outputDirectory, basename(tempy.file({ extension: 'js' })))
  const indexHtmlPath = join(outputDirectory, 'index.html')
  const port = await findOpenPort()
  const url = `http://localhost:${port}`
  const logErrors = (errors: string[]) => Promise.all(errors.map(logger.error))
  const makeAbsolutePath = (path: string) => (isAbsolute(path) ? path : join(cwd, path))
  const { updateResults, removeFilePath } = new Results()

  // shared mutable state
  let queuedMetadata: TestMetadata[] = []
  let previousMetadata: TestMetadata[] = []
  let testsAreRunning = false
  let writingToDisk = false
  let scheduleNextRunHandle: NodeJS.Timer
  let newFileOnDisk = false
  let killBrowser: () => void = () => void 0
  let previousWebpackHash: string = ''
  let firstRun = true
  let timeToRunTests: number = 0
  let browserOpenTime: number = 0
  let testsCompletedTime: number = 0

  const killTestBrowser = () => (!keepAlive && killBrowser ? killBrowser() : void 0)

  const setupTestBrowser = async () => {
    const { browser, keepAlive } = options

    if (browser !== 'chrome-headless') {
      const launcher = await getLauncher()

      const run = async () => {
        killTestBrowser()

        logger.log('Opening browser...')
        browserOpenTime = Date.now()

        const instance = await openBrowser(browser, url, keepAlive, launcher)

        if (!firstRun) {
          const lastCompletion = testsCompletedTime
          // Re-run tests if they seem to have stalled - this can happen when browsers are opened in succession quite quickly
          // I've only been able to make it do this when I am very rapidly changing and saving a test file to purposely try and break things.
          delay(timeToRunTests * 3).then(
            () => (testsCompletedTime === lastCompletion ? run() : void 0),
          )
        }

        killBrowser = () => instance.stop()
      }

      return run
    }

    const { launch } = require(sync('chrome-launcher', { basedir: cwd }))

    const run = async () => {
      killTestBrowser()

      logger.log('Opening browser...')
      browserOpenTime = Date.now()

      const chrome = await launch({ startingUrl: url })

      if (!firstRun) {
        const lastCompletion = testsCompletedTime
        delay(timeToRunTests * 3).then(
          () => (testsCompletedTime === lastCompletion ? run() : void 0),
        )
      }

      killBrowser = () => chrome.kill()
    }

    return run
  }

  const runTestsInBrowser = await setupTestBrowser()

  const newStats = async (stats: Stats) => {
    const shouldReturnEarly =
      (stats as any).hash === previousWebpackHash || !newFileOnDisk || testsAreRunning

    if (shouldReturnEarly) {
      previousWebpackHash = (stats as any).hash

      return
    }

    if (stats.hasErrors()) {
      const { errors } = stats.toJson()

      return logErrors(errors)
    }

    testsAreRunning = true

    runTestsInBrowser()
  }

  const writeToDisk = (metadata: TestMetadata[]) => {
    writeFileSync(temporaryPath, generateTestBundle(cwd, outputDirectory, port, timeout, metadata))

    newFileOnDisk = true
    writingToDisk = false

    if (firstRun) {
      watchFile(cwd, temporaryPath, bundlePath, options.webpackConfiguration, newStats, errCb)
    }
  }

  const typeCheckMetadata = async (metadata: TestMetadata[]) => {
    logger.log('Typechecking...')
    const processResults = await typecheckInAnotherProcess(cwd, metadata.map(x => x.filePath))
    logger.log('Type checking complete')

    typeCheckCb(processResults)
  }

  const removeFileFromQueue = (filePath: string) => {
    const path = makeAbsolute(cwd, filePath)
    removeFilePath(path)

    queuedMetadata = queuedMetadata.filter(x => makeAbsolutePath(x.filePath) !== path)
  }

  const scheduleNextBundleWrite = () => {
    if (testsAreRunning || writingToDisk) {
      clearTimeout(scheduleNextRunHandle)

      scheduleNextRunHandle = setTimeout(scheduleNextBundleWrite, 600)

      return
    }

    writingToDisk = true
    const currentQueue = queuedMetadata.slice()

    writeToDisk(currentQueue)

    if (typeCheck) {
      typeCheckMetadata(currentQueue)
    }

    queuedMetadata = []
  }

  const updateMetadataAndWriteBundle = async (metadata: TestMetadata[]) => {
    queuedMetadata = updateQueue(metadata, queuedMetadata)

    if (isEqual(metadata, previousMetadata) || queuedMetadata.length === 0) {
      return
    }

    previousMetadata = metadata

    scheduleNextBundleWrite()
  }

  const server = createServer(
    setupServer(logger, outputDirectory, newResults => {
      firstRun = false

      if (!keepAlive && killBrowser) {
        killBrowser()
      }

      const results = updateResults(newResults)
      const stats = getTestStats(getTestResults(results))

      cb({ results, stats })

      testsCompletedTime = Date.now()
      timeToRunTests = testsCompletedTime - browserOpenTime
      newFileOnDisk = testsAreRunning = false
    }),
  )

  writeFileSync(indexHtmlPath, createIndexHtml(basename(bundlePath)))
  server.listen(port, '0.0.0.0')

  const { dispose: stopWatchingMetadata } = await watchTestMetadata(
    cwd,
    fileGlobs,
    compilerOptions,
    mode,
    logger,
    removeFileFromQueue,
    updateMetadataAndWriteBundle,
  )

  const dispose = () => {
    stopWatchingMetadata()
    server.close()
  }

  return { dispose }
}
