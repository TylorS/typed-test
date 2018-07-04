import { watchTestMetadata } from '../tests/watchTestMetadata'
import { TestMetadata } from '../types'
import { findTsConfig } from '../typescript/findTsConfig'
import { findTypedTestConfig } from './findTypedTestConfig'
import { logResults, logTypeCheckResults } from './log'
import { TestRunner } from './TestRunner'
import { Options } from './types'

const EXCLUDE = ['./node_modules/**']

export async function runTypedTest(userOptions?: Options) {
  const cwd = process.cwd()
  const { compilerOptions, files = [], include = [], exclude = EXCLUDE } = findTsConfig(cwd)
  const fileGlobs = [...files, ...include, ...exclude.map(x => `!${x}`)]
  const typedTestConfig = findTypedTestConfig(compilerOptions, cwd)
  const {
    options: { mode, watch },
    results: { removeFilePath },
    runTests,
    logger,
  } = new TestRunner({ ...typedTestConfig, ...userOptions }, null, cwd)

  return watchTestMetadata(
    cwd,
    fileGlobs,
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
