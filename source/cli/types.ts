import { Browsers } from '../browser/openBrowser'
import { TestStats } from '../results'
import { JsonResults } from '../types'
import { Configuration } from 'webpack'

export type TypedTestOptions = {
  mode: 'node' | 'browser'
  files: Array<string>
  timeout: number
  browser: Browsers
  keepAlive: boolean
  typeCheck: boolean
  watch: boolean
  webpackConfiguration: (defaultConfiguration: Configuration) => Configuration
}

export type WebpackConfig = Configuration

export type Options = Partial<TypedTestOptions>

export type StatsAndResults = {
  results: JsonResults[]
  stats: TestStats
}
