import { watchTestMetadata } from '../tests/watchTestMetadata'
import { TestMetadata } from '../types'
import { findTsConfig } from '../typescript/findTsConfig'
import { findTypedTestConfigs } from './findTypedTestConfigs'
import { logResults, logTypeCheckResults } from './log'
import { TestRunner } from './TestRunner'
import { Options } from './types'
import { watchBrowserTests } from './watchBrowserTests'
import { CompilerOptions } from 'typescript'
import { findTestMetadata } from '../tests/findTestMetadata'
import { Results } from './Results'

const EXCLUDE = ['./node_modules/**']

export async function runTypedTest(userOptions?: Options): Promise<Array<{ dispose: () => void }>> {
  const cwd = process.cwd()
  const { compilerOptions, files = [], include = [], exclude = EXCLUDE } = findTsConfig(cwd)
  const fileGlobs = [...files, ...include, ...exclude.map(x => `!${x}`)]
  const typedTestConfigs = findTypedTestConfigs(compilerOptions, cwd)
  const results = new Results()
  const hasWatch = typedTestConfigs.some(x => !!x.watch) || (!!userOptions && !!userOptions.watch)

  const disposables = await Promise.all(
    typedTestConfigs.map(typedTestConfig =>
      run(typedTestConfig, userOptions, cwd, fileGlobs, compilerOptions, hasWatch, results),
    ),
  )

  return disposables
}

async function run(
  typedTestConfig: Options,
  userOptions: Options | undefined,
  cwd: string,
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  hasWatch: boolean,
  results: Results,
): Promise<{ dispose: () => void }> {
  const {
    options,
    results: { removeFilePath },
    runTests,
    logger,
  } = new TestRunner({ ...typedTestConfig, ...userOptions }, results, cwd)
  const { mode, watch, files: userFiles } = options
  const fileGlobsToUse = userFiles.length > 0 ? userFiles : fileGlobs

  if (mode == 'browser' && watch) {
    return watchBrowserTests(
      fileGlobsToUse,
      compilerOptions,
      options,
      cwd,
      logger,
      ({ results }) => logResults(logger, results),
      console.error,
      results => logTypeCheckResults(logger, results),
    )
  }

  const handleMetadata = async (metadata: TestMetadata[]) => {
    const [{ stats, results }, processResults] = await runTests(metadata)

    logTypeCheckResults(logger, processResults)
    logResults(logger, results)

    if (!hasWatch) {
      const exitCode =
        processResults.exitCode > 0 ? processResults.exitCode : stats.failing > 0 ? 1 : 0

      process.exit(exitCode)
    }
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
  handleMetadata(metadata)

  return { dispose: () => {} }
}
