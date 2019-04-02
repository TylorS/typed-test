import { CompilerOptions, ModuleKind } from 'typescript'
import { getTestResults, getTestStats } from '../results'
import { findTestMetadata } from '../tests/findTestMetadata'
import { watchTestMetadata } from '../tests/watchTestMetadata'
import { TestMetadata } from '../types'
import { findTsConfig } from '../typescript/findTsConfig'
import { findTypedTestConfigs } from './findTypedTestConfigs'
import { logResults, logTypeCheckResults } from './log'
import { Results } from './Results'
import { TestRunner } from './TestRunner'
import { Options } from './types'
import { watchBrowserTests } from './watchBrowserTests'

const EXCLUDE = ['./node_modules/**']

export async function runTypedTest(userOptions?: Options): Promise<Array<{ dispose: () => void }>> {
  const cwd = process.cwd()
  const { compilerOptions, files = [], include = [], exclude = EXCLUDE } = findTsConfig(cwd)

  compilerOptions.module = ModuleKind.CommonJS

  const fileGlobs = [...files, ...include, ...exclude.map(x => `!${x}`)]
  const typedTestConfigs = findTypedTestConfigs(compilerOptions, cwd)
  const results = new Results()
  const hasWatch = typedTestConfigs.some(x => !!x.watch) || (!!userOptions && !!userOptions.watch)

  const disposables = await Promise.all(
    typedTestConfigs.map(typedTestConfig =>
      run(
        { ...typedTestConfig, ...userOptions },
        cwd,
        fileGlobs,
        compilerOptions,
        results,
        hasWatch,
      ),
    ),
  )

  if (!hasWatch) {
    const stats = getTestStats(getTestResults(results.getResults()))
    const exitCode = stats.failing > 0 ? 1 : 0

    process.exit(exitCode)
  }

  return disposables
}

async function run(
  userOptions: Options,
  cwd: string,
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  globalResults: Results,
  useGlobalResults: boolean,
): Promise<{ dispose: () => void }> {
  const {
    options,
    results: { removeFilePath },
    runTests,
    logger,
  } = new TestRunner(userOptions, useGlobalResults ? globalResults : null, cwd)
  const { updateResults } = globalResults
  const { mode, watch, files: userFiles } = options
  const fileGlobsToUse = userFiles.length > 0 ? userFiles : fileGlobs

  if (mode === 'browser' && watch) {
    return watchBrowserTests(
      fileGlobsToUse,
      compilerOptions,
      options,
      cwd,
      logger,
      ({ results }) => {
        updateResults(results)

        logResults(logger, results)
      },
      console.error,
      results => logTypeCheckResults(logger, results),
    )
  }

  const handleMetadata = async (metadata: TestMetadata[]) => {
    const [{ results }, processResults] = await runTests(metadata)

    updateResults(results)

    logTypeCheckResults(logger, processResults)
    logResults(logger, results)
  }

  if (watch) {
    return watchTestMetadata(
      cwd,
      fileGlobsToUse,
      compilerOptions,
      mode,
      logger,
      removeFilePath,
      handleMetadata,
    )
  }

  const metadata = await findTestMetadata(cwd, fileGlobsToUse, compilerOptions, mode)
  await handleMetadata(metadata)

  // tslint:disable-next-line:no-empty
  return { dispose: () => {} }
}
