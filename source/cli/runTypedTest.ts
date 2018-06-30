import { CompilerOptions } from '../../node_modules/typescript'
import { findOpenPort } from '../browser/findOpenPort'
import { Browsers, getLauncher, openBrowser } from '../browser/openBrowser'
import { setupServer } from '../browser/server'
import { setupBrowser } from '../browser/setupBrowser'
import { JsonResults } from '../browser/types'
import { runTests } from '../common/runTests'
import { collectTests } from '../node/collectTests'
import { getTestResults, getTestStats, resultsToString, statsToString, TestStats } from '../results'
import { findTestMetadata } from '../tests'
import { TestMetadata } from '../types'
import { findTsConfig } from '../typescript/findTsConfig'
import { typecheckInAnotherProcess } from '../typescript/typeCheckInAnotherProcess'
import { resolveFileGlobs } from './resolveFileGlobs'

export type TypedTestOptions = {
  mode: 'node' | 'browser'
  timeout: number
  browser: Browsers
  keepAlive: boolean
  typeCheck: boolean
  watch: boolean
}

type StatsAndResults = { readonly results: JsonResults[]; readonly stats: TestStats }

const defaultOptions: TypedTestOptions = {
  mode: 'node',
  timeout: 2000,
  browser: 'chrome',
  keepAlive: false,
  typeCheck: true,
  watch: false,
}

const EXCLUDE = ['./node_modules/**']

export async function runTypedTest(userOptions?: Partial<TypedTestOptions>) {
  const cwd = process.cwd()
  const options: TypedTestOptions = {
    ...defaultOptions,
    ...userOptions,
  }
  const { watch, typeCheck } = options
  const { compilerOptions, files = [], include = [], exclude = EXCLUDE } = findTsConfig()
  const sourcePaths = await resolveFileGlobs([...files, ...include, ...exclude.map(x => `!${x}`)])

  const [{ results, stats }, { exitCode = 0, stderr = '', stdout = '' } = {}] = await Promise.all([
    findAndRunTests(cwd, sourcePaths, compilerOptions, options),
    typeCheck ? typecheckInAnotherProcess(sourcePaths) : Promise.resolve(void 0),
  ])
  const testResults = getTestResults(results)
  const typedTestExitCode = exitCode > 1 ? exitCode : stats.failing > 0 ? 1 : 0

  if (stdout) {
    console.log(stdout.trim())
  }

  if (typedTestExitCode > 1 && stderr) {
    console.error(stderr.trim())
  }

  console.log(resultsToString(testResults))
  console.log(statsToString(stats))

  if (!watch) {
    process.exit(typedTestExitCode)
  }
}

async function findAndRunTests(
  cwd: string,
  sourcePaths: string[],
  compilerOptions: CompilerOptions,
  options: TypedTestOptions,
): Promise<StatsAndResults> {
  const { mode } = options

  console.log('Finding tests...')
  const testMetadata = await findTestMetadata(sourcePaths, compilerOptions, mode)
  const run = options.mode === 'browser' ? runBrowserTests : runNodeTests

  return run(options, cwd, testMetadata)
}

async function runBrowserTests(
  { timeout, browser, keepAlive }: TypedTestOptions,
  cwd: string,
  testMetadata: TestMetadata[],
): Promise<StatsAndResults> {
  console.log('Bundling tests...')
  const port = await findOpenPort()
  const { outputDirectory } = await setupBrowser(cwd, port, timeout, testMetadata)
  console.log('Spinning up server...')

  return new Promise<StatsAndResults>(async resolve => {
    const app = setupServer(outputDirectory, (results, stats) => resolve({ results, stats }))
    const launch = await getLauncher()

    app.listen(port, '0.0.0.0', async () => {
      console.log('Opening browser...')
      await openBrowser(browser, `http://localhost:${port}`, keepAlive, launch)
    })
  })
}

async function runNodeTests(
  { timeout }: TypedTestOptions,
  cwd: string,
  testMetadata: TestMetadata[],
): Promise<StatsAndResults> {
  console.log('Running tests...')
  const testsWithResults = await runTests(timeout, collectTests(cwd, testMetadata))
  const testResults = getTestResults(testsWithResults)
  const stats = getTestStats(testResults)

  return { results: testsWithResults, stats }
}
