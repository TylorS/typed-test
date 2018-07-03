import { createServer } from 'http'
import { launch } from 'puppeteer'
import { findOpenPort } from '../browser/findOpenPort'
import { Browsers, getLauncher, openBrowser } from '../browser/openBrowser'
import { setupServer } from '../browser/server'
import { setupBrowser } from '../browser/setupBrowser'
import { TestMetadata } from '../types'
import { StatsAndResults, TypedTestOptions } from './types'

export async function runBrowserTests(
  options: TypedTestOptions,
  cwd: string,
  testMetadata: TestMetadata[],
): Promise<StatsAndResults> {
  const { timeout, browser, keepAlive } = options
  const { port, outputDirectory } = await setup(cwd, timeout, testMetadata)

  return new Promise<StatsAndResults>(runTests(outputDirectory, browser, keepAlive, port)).catch(
    () => runBrowserTests(options, cwd, testMetadata),
  )
}

async function setup(cwd: string, timeout: number, testMetadata: TestMetadata[]) {
  console.log('Bundling tests...')
  const port = await findOpenPort()
  const { outputDirectory } = await setupBrowser(cwd, port, timeout, testMetadata)
  console.log('Spinning up server...')

  return { port, outputDirectory }
}

function runTests(outputDirectory: string, browser: Browsers, keepAlive: boolean, port: number) {
  return async (resolve: (stats: StatsAndResults) => void) => {
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

    server.listen(port, '0.0.0.0', () => listen(browser, keepAlive, port, d => (dispose = d)))
  }
}

async function listen(
  browser: Browsers,
  keepAlive: boolean,
  port: number,
  setDispose: (dispose: () => void) => void,
) {
  const url = `http://localhost:${port}`

  console.log('Opening browser...')
  if (browser !== 'chrome-headless') {
    const instance = await openBrowser(browser, url, keepAlive, await getLauncher())

    setDispose(() => instance.stop())

    return
  }

  const headlessInstance = await launch()
  const page = await headlessInstance.newPage()
  await page.goto(url)

  setDispose(() => headlessInstance.close())
}
