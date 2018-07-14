import { Options } from './source'

const config: Options = {
  files: ['source/**/*.test.ts'],
}

const config2: Options = {
  mode: 'browser',
  files: ['source/**/*.browser-test.ts'],
}

export default [config, config2]
