import {
  Browsers,
  findOpenPort,
  getLauncher,
  openBrowser,
  setupBrowser,
  setupServer,
} from '../browser'
import { runTests } from '../common/runTests'
import { collectTests } from '../node'
import { getTestResults, getTestStats, resultsToString, statsToString } from '../results'
import { findTestMetadata } from '../tests'

export type TypedTestOptions = {
  mode: 'node' | 'browser'
  timeout: number
  browser: Browsers
  keepAlive: boolean
  typeCheck: boolean
}

const defaultOptions: TypedTestOptions = {
  mode: 'node',
  timeout: 2000,
  browser: 'chrome',
  keepAlive: false,
  typeCheck: true,
}

export async function runTypedTest(userOptions?: Partial<TypedTestOptions>) {
  const { mode, timeout, browser, keepAlive, typeCheck }: TypedTestOptions = {
    ...defaultOptions,
    ...userOptions,
  }
  const cwd = process.cwd()
  console.log('Finding tests...')

  if (typeCheck) {
    console.log('Type-checking files...')
  }

  const testMetadata = await findTestMetadata(mode, typeCheck)

  if (mode === 'browser') {
    console.log('Bundling tests...')
    const port = await findOpenPort()
    const { outputDirectory } = await setupBrowser(cwd, port, timeout, testMetadata)
    console.log('Spinning up server...')
    const app = setupServer(outputDirectory, false)
    const launch = await getLauncher()

    app.listen(port, '0.0.0.0', async () => {
      console.log('Opening browser...')
      await openBrowser(browser, `http://localhost:${port}`, keepAlive, launch)
    })

    return
  }

  console.log('Running tests...')
  const results = await runTests(timeout, collectTests(cwd, testMetadata))
  const testResults = getTestResults(results)
  const stats = getTestStats(testResults)

  console.log(resultsToString(testResults))
  console.log(statsToString(stats))

  const exitCode = stats.failing > 0 ? 1 : 0

  process.exit(exitCode)
}
