import { Browsers, getLauncher, openBrowser, setupBrowser, setupServer } from './browser'
import { runTests } from './common/runTests'
import { collectTests } from './node'
import { getTestResults, getTestStats, resultsToString, statsToString } from './results'
import { findTestMetadata } from './tests'

async function main(
  cwd: string,
  mode: 'node' | 'browser',
  timeout: number,
  port: number,
  watch: boolean,
  browser: Browsers,
  keepAlive: boolean,
) {
  const testMetadata = await findTestMetadata()

  if (mode === 'browser') {
    const { outputDirectory } = await setupBrowser(cwd, port, timeout, testMetadata)
    const app = setupServer(outputDirectory, watch)
    const launch = await getLauncher()

    app.listen(port, '0.0.0.0', async () => {
      await openBrowser(browser, `http://localhost:${port}`, keepAlive, launch)
    })
  }

  const results = await runTests(timeout, collectTests(cwd, testMetadata))
  const testResults = getTestResults(results)
  const stats = getTestStats(testResults)

  console.log(resultsToString(testResults))
  console.log(statsToString(stats))

  const exitCode = stats.failing > 0 ? 1 : 0

  process.exit(exitCode)
}

main(process.cwd(), 'browser', 2000, 3000, false, 'chrome', false)
