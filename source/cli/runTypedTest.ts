import { Browsers } from '../browser/openBrowser'
import { JsonResults } from '../browser/types'
import { collectByKey } from '../common/collectByKey'
import { flatten } from '../common/flatten'
import { TestStats } from '../results'
import { watchTestMetadata } from '../tests/watchTestMetadata'
import { TestMetadata } from '../types'
import { findTsConfig } from '../typescript/findTsConfig'
import { typecheckInAnotherProcess } from '../typescript/typeCheckInAnotherProcess'
import { logResults, logTypeCheckResults } from './log'
import { runBrowserTests } from './runBrowserTests'
import { runNodeTests } from './runNodeTests'

export type TypedTestOptions = {
  mode: 'node' | 'browser'
  timeout: number
  browser: Browsers
  keepAlive: boolean
  typeCheck: boolean
  watch: boolean
}

export type StatsAndResults = {
  results: JsonResults[]
  stats: TestStats
}

const defaultOptions: TypedTestOptions = {
  mode: 'node',
  timeout: 2000,
  browser: 'chrome-headless',
  keepAlive: false,
  typeCheck: false,
  watch: false,
}

const EXCLUDE = ['./node_modules/**']

export async function runTypedTest(userOptions?: Partial<TypedTestOptions>) {
  const cwd = process.cwd()
  const options: TypedTestOptions = {
    ...defaultOptions,
    ...userOptions,
  }
  const { watch, typeCheck, mode } = options
  const { compilerOptions, files = [], include = [], exclude = EXCLUDE } = findTsConfig()
  const fileGlobs = [...files, ...include, ...exclude.map(x => `!${x}`)]
  const resultsMap = new Map<string, JsonResults[]>()

  function updateResults(results: JsonResults[]): JsonResults[] {
    const resultsByFilePath = collectByKey(x => x.filePath, results)
    const filePaths = Object.keys(resultsByFilePath)

    filePaths.forEach(filePath => {
      resultsMap.set(filePath, resultsByFilePath[filePath])
    })

    return getResults()
  }

  function getResults() {
    return flatten(Array.from(resultsMap.values()))
  }

  function removeFilePath(filePath: string) {
    resultsMap.delete(filePath)

    logResults(getResults())
  }

  const run = mode === 'node' ? runNodeTests : runBrowserTests

  watchTestMetadata(
    fileGlobs,
    compilerOptions,
    mode,
    removeFilePath,
    async (metadata: TestMetadata[]) => {
      const sourcePaths = Array.from(new Set(metadata.map(x => x.filePath)))
      const [{ stats }, processResults = { exitCode: 0 }] = await Promise.all([
        run(options, cwd, metadata).then(x => ({
          ...x,
          results: logResults(updateResults(x.results)),
        })),
        typeCheck
          ? typecheckInAnotherProcess(sourcePaths).then(x => (logTypeCheckResults(x), x))
          : Promise.resolve(void 0),
      ])

      if (!watch) {
        const exitCode =
          processResults.exitCode > 1 ? processResults.exitCode : stats.failing > 0 ? 1 : 0

        process.exit(exitCode)
      }
    },
  )
}
