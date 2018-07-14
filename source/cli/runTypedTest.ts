import { watchTestMetadata } from '../tests/watchTestMetadata'
import { TestMetadata } from '../types'
import { findTsConfig } from '../typescript/findTsConfig'
import { findTypedTestConfig } from './findTypedTestConfig'
import { logResults, logTypeCheckResults } from './log'
import { TestRunner } from './TestRunner'
import { Options } from './types'
import { watchBrowserTests } from './watchBrowserTests'

const EXCLUDE = ['./node_modules/**']

export async function runTypedTest(userOptions?: Options) {
  const cwd = process.cwd()
  const { compilerOptions, files = [], include = [], exclude = EXCLUDE } = findTsConfig(cwd)
  const fileGlobs = [...files, ...include, ...exclude.map(x => `!${x}`)]
  const typedTestConfig = findTypedTestConfig(compilerOptions, cwd)
  const {
    options,
    results: { removeFilePath },
    runTests,
    logger,
  } = new TestRunner({ ...typedTestConfig, ...userOptions }, null, cwd)
  const { mode, watch, files: userFiles } = options

  if (mode == 'browser' && watch) {
    return watchBrowserTests(
      userFiles.length > 0 ? userFiles : fileGlobs,
      compilerOptions,
      options,
      cwd,
      logger,
      ({ results }) => logResults(logger, results),
      console.error,
      results => logTypeCheckResults(logger, results),
    )
  }

  return watchTestMetadata(
    cwd,
    userFiles.length > 0 ? userFiles : fileGlobs,
    compilerOptions,
    mode,
    logger,
    removeFilePath,
    async (metadata: TestMetadata[]) => {
      const [{ stats, results }, processResults] = await runTests(metadata)

      logTypeCheckResults(logger, processResults)
      logResults(logger, results)

      if (!watch) {
        const exitCode =
          processResults.exitCode > 0 ? processResults.exitCode : stats.failing > 0 ? 1 : 0

        process.exit(exitCode)
      }
    },
  )
}
