import { createServer } from 'http'
import { sync } from 'resolve'
import { findOpenPort } from '../browser/findOpenPort'
import { Browsers, getLauncher, openBrowser } from '../browser/openBrowser'
import { setupServer } from '../browser/server'
import { setupBrowser } from '../browser/setupBrowser'
import { Logger, TestMetadata } from '../types'
import { StatsAndResults, TypedTestOptions } from './types'

export async function runBrowserTests(
  options: TypedTestOptions,
  cwd: string,
  logger: Logger,
  testMetadata: TestMetadata[],
): Promise<StatsAndResults> {
  const { timeout, browser, keepAlive } = options
  const { port, outputDirectory } = await setup(logger, cwd, timeout, testMetadata)

  return new Promise<StatsAndResults>(
    runTests(cwd, logger, outputDirectory, browser, keepAlive, port),
  ).catch(() => runBrowserTests(options, cwd, logger, testMetadata))
}

async function setup(logger: Logger, cwd: string, timeout: number, testMetadata: TestMetadata[]) {
  await logger.log('Bundling tests...')
  const port = await findOpenPort()
  const { outputDirectory } = await setupBrowser(cwd, port, timeout, logger, testMetadata)
  await logger.log('Spinning up server...')

  return { port, outputDirectory }
}

function runTests(
  cwd: string,
  logger: Logger,
  outputDirectory: string,
  browser: Browsers,
  keepAlive: boolean,
  port: number,
) {
  return async (resolve: (stats: StatsAndResults) => void) => {
    let server: ReturnType<typeof createServer>
    let dispose: () => void
    const app = setupServer(logger, outputDirectory, (results, stats) => {
      if (server) {
        server.close()
      }

      if (dispose) {
        dispose()
      }

      resolve({ results, stats })
    })

    server = createServer(app)

    server.listen(port, '0.0.0.0', () =>
      listen(cwd, logger, browser, keepAlive, port, d => (dispose = d)),
    )
  }
}

async function listen(
  cwd: string,
  logger: Logger,
  browser: Browsers,
  keepAlive: boolean,
  port: number,
  setDispose: (dispose: () => void) => void,
) {
  const url = `http://localhost:${port}`

  await logger.log('Opening browser...')
  if (browser !== 'chrome-headless') {
    const instance = await openBrowser(browser, url, keepAlive, await getLauncher())

    setDispose(() => instance.stop())

    return
  }

  const { launch } = require(sync('puppeteer', { basedir: cwd }))

  const headlessInstance = await launch()
  setDispose(() => headlessInstance.close())

  const page = await headlessInstance.newPage()
  await page.goto(url)
}
