import { createServer } from 'http'
import { launch } from 'puppeteer'
import { findOpenPort } from '../browser/findOpenPort'
import { getLauncher, openBrowser } from '../browser/openBrowser'
import { setupServer } from '../browser/server'
import { setupBrowser } from '../browser/setupBrowser'
import { TestMetadata } from '../types'
import { StatsAndResults, TypedTestOptions } from './types'

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
    let dispose: () => void
    const app = setupServer(outputDirectory, (results, stats) => {
      if (server) {
        server.close()
      }

      if (dispose) {
        dispose()
      }

      resolve({ results, stats })
    })

    server = createServer(app)

    server.listen(port, '0.0.0.0', async () => {
      const url = `http://localhost:${port}`

      console.log('Opening browser...')
      if (browser !== 'chrome-headless') {
        const instance = await openBrowser(browser, url, keepAlive, await getLauncher())

        dispose = () => instance.stop()

        return
      }

      const headlessInstance = await launch()
      const page = await headlessInstance.newPage()
      await page.goto(url)

      dispose = () => headlessInstance.close()
    })
  })
}
