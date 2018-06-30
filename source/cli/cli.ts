import yargs from 'yargs'
import { runTypedTest, TypedTestOptions } from './runTypedTest'

const options = yargs
  .options({
    mode: {
      choices: ['node', 'browser'],
      requiresArg: true,
      defaultDescription: 'node',
      group: 'Typed Test',
    },
    timeout: {
      number: true,
      requiresArg: true,
      defaultDescription: '2000',
      group: 'Typed Test',
    },
    browser: {
      choices: ['chrome', 'chromium', 'firefox', 'opera', 'safari', 'ie'],
      requiresArg: true,
      defaultDescription: 'chrome',
      group: 'Browser Mode',
    },
    keepAlive: {
      boolean: true,
      defaultDescription: 'false',
      group: 'Browser Mode',
    },
    typeCheck: {
      boolean: true,
      defaultDescription: 'true',
      group: 'Typed Test',
    },
    watch: {
      boolean: true,
      defaultDescription: 'false',
      group: 'Typed Test',
    },
  })
  .help().argv as Partial<TypedTestOptions>

runTypedTest(options)
