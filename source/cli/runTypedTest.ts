import { watchTestMetadata } from '../tests/watchTestMetadata'
import { TestMetadata } from '../types'
import { TestRunner } from './TestRunner'
import { TypedTestOptions } from './types'

export async function runTypedTest(userOptions?: Partial<TypedTestOptions>) {
  const {
    fileGlobs,
    compilerOptions,
    options: { mode, watch },
    results: { removeFilePath },
    runTests,
  } = new TestRunner(userOptions)

  watchTestMetadata(
    fileGlobs,
    compilerOptions,
    mode,
    removeFilePath,
    async (metadata: TestMetadata[]) => {
      const [{ stats }, processResults] = await runTests(metadata)

      if (!watch) {
        const exitCode =
          processResults.exitCode > 1 ? processResults.exitCode : stats.failing > 0 ? 1 : 0

        process.exit(exitCode)
      }
    },
  )
}
