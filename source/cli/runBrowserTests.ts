import { createServer } from 'http'
import { findOpenPort } from '../browser/findOpenPort'
import { getLauncher, openBrowser } from '../browser/openBrowser'
import { setupServer } from '../browser/server'
import { setupBrowser } from '../browser/setupBrowser'
import { TestMetadata } from '../types'
import { StatsAndResults, TypedTestOptions } from './runTypedTest'

export async function runBrowserTests(
  { timeout, browser, keepAlive }: TypedTestOptions,
  cwd: string,
  testMetadata: TestMetadata[],
): Promise<StatsAndResults> {
  console.log('Bundling tests...')
  const port = await findOpenPort()
  const { outputDirectory } = await setupBrowser(cwd, port, timeout, testMetadata)
  console.log('Spinning up server...')

  return new Promise<StatsAndResults>(async resolve => {
    let server: ReturnType<typeof createServer>
    const app = setupServer(outputDirectory, (results, stats) => {
      server.close()
      resolve({ results, stats })
    })
    const launch = await getLauncher()

    server = createServer(app)

    server.listen(port, '0.0.0.0', async () => {
      console.log('Opening browser...')
      await openBrowser(browser, `http://localhost:${port}`, keepAlive, launch)
    })
  })
}
