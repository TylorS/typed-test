import { ChildProcess } from 'child_process'
// tslint:disable-next-line:no-var-requires
const launcher: JamesBrowserLauncher = require('james-browser-launcher')

export function getLauncher(): Promise<BrowserStart> {
  return new Promise((resolve, reject) => {
    launcher((err, launch) => {
      if (err) {
        return reject(err)
      }

      resolve(launch)
    })
  })
}

export async function openBrowser(
  browser: Browsers,
  url: string,
  keepAlive: boolean,
  launch: BrowserStart,
): Promise<BrowserInstance> {
  return new Promise<BrowserInstance>((resolve, reject) => {
    launch(url, { browser, options: ['--disable-gpu'], detached: keepAlive }, (error, instance) => {
      if (error) {
        return reject(error)
      }

      if (keepAlive) {
        instance.process.unref()
      } else {
        process.on('exit', () => tryStopInstance(instance))
      }

      resolve(instance)
    })
  })
}

function tryStopInstance(browser: BrowserInstance) {
  try {
    browser.stop()
  } catch {
    return void 0
  }
}

export type Browsers =
  | 'chrome-headless'
  | 'chrome'
  | 'chromium'
  | 'firefox'
  | 'opera'
  | 'safari'
  | 'ie'

type JamesBrowserLauncher = (cb: (error: Error | null, launch: BrowserStart) => void) => void

export type BrowserStart = (
  uri: string,
  options: StartOption,
  cb: (err: Error | null, instance: BrowserInstance) => void,
) => void

export type StartOption = {
  browser: Browsers
  version?: string
  proxy?: string
  options?: string[]
  skipDefaults?: boolean
  detached?: boolean
  noProxy?: boolean
  headless?: boolean
}

export type BrowserInstance = {
  command: string
  args: string[]
  image: string
  processName: string
  pid: number
  process: ChildProcess
  stdout: ChildProcess['stdout']
  stderr: ChildProcess['stderr']
  stop: () => void
}
