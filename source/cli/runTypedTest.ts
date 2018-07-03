import { watchTestMetadata } from '../tests/watchTestMetadata'
import { TestMetadata } from '../types'
import { logResults, logTypeCheckResults } from './log'
import { TestRunner } from './TestRunner'
import { TypedTestOptions } from './types'

export async function runTypedTest(userOptions?: Partial<TypedTestOptions>) {
  const cwd = process.cwd()
  const {
    fileGlobs,
    compilerOptions,
    options: { mode, watch },
    results: { removeFilePath },
    runTests,
  } = new TestRunner(cwd, userOptions)

  watchTestMetadata(
    cwd,
    fileGlobs,
    compilerOptions,
    mode,
    removeFilePath,
    async (metadata: TestMetadata[]) => {
      const [{ stats, results }, processResults] = await runTests(metadata)

      logTypeCheckResults(processResults)
      logResults(results)

      if (!watch) {
        const exitCode =
          processResults.exitCode > 1 ? processResults.exitCode : stats.failing > 0 ? 1 : 0

        process.exit(exitCode)
      }
    },
  )
}
