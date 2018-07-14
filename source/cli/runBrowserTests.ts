import { createServer } from 'http'
import { sync } from 'resolve'
import { findOpenPort } from '../browser/findOpenPort'
import { getLauncher, openBrowser } from '../browser/openBrowser'
import { setupServer } from '../browser/server'
import { setupBrowser } from '../browser/setupBrowser'
import { Logger, TestMetadata } from '../types'
import { StatsAndResults, TypedTestOptions } from './types'
import { Configuration } from 'webpack'

export async function runBrowserTests(
  options: TypedTestOptions,
  cwd: string,
  logger: Logger,
  testMetadata: TestMetadata[],
): Promise<StatsAndResults> {
  const { timeout, webpackConfiguration } = options
  const { port, outputDirectory } = await setup(
    logger,
    cwd,
    timeout,
    testMetadata,
    webpackConfiguration,
  )

  return new Promise<StatsAndResults>(runTests(cwd, options, logger, outputDirectory, port)).catch(
    () => runBrowserTests(options, cwd, logger, testMetadata),
  )
}

async function setup(
  logger: Logger,
  cwd: string,
  timeout: number,
  testMetadata: TestMetadata[],
  webpackConfiguration: (config: Configuration) => Configuration,
) {
  await logger.log('Bundling tests...')
  const port = await findOpenPort()
  const { outputDirectory } = await setupBrowser(
    cwd,
    port,
    timeout,
    logger,
    testMetadata,
    webpackConfiguration,
  )
  await logger.log('Spinning up server...')

  return { port, outputDirectory }
}

function runTests(
  cwd: string,
  options: TypedTestOptions,
  logger: Logger,
  outputDirectory: string,
  port: number,
) {
  const { keepAlive } = options

  return (resolve: (stats: StatsAndResults) => void) => {
    let server: ReturnType<typeof createServer>
    let dispose: () => void
    const app = setupServer(logger, outputDirectory, (results, stats) => {
      if (server) {
        server.close()
      }

      if (!keepAlive && dispose) {
        dispose()
      }

      resolve({ results, stats })
    })

    server = createServer(app)

    server.listen(port, '0.0.0.0', () =>
      openTestBrowser(cwd, logger, options, port, d => (dispose = d)),
    )
  }
}

async function openTestBrowser(
  cwd: string,
  logger: Logger,
  options: TypedTestOptions,
  port: number,
  setDispose: (dispose: () => void) => void,
) {
  const { browser, keepAlive } = options
  const url = `http://localhost:${port}`

  if (browser !== 'chrome-headless') {
    await logger.log('Opening browser...')
    const instance = await openBrowser(browser, url, keepAlive, await getLauncher())

    setDispose(() => instance.stop())

    return
  }

  // tslint:disable-next-line:no-var-requires
  const { launch } = require(sync('chrome-launcher', { basedir: cwd }))

  const chrome = await launch({ startingUrl: url })
  setDispose(() => chrome.kill())
}
