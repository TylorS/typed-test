import { Browsers } from '../browser/openBrowser'
import { TestStats } from '../results'
import { JsonResults } from '../types'

export type TypedTestOptions = {
  mode: 'node' | 'browser'
  timeout: number
  browser: Browsers
  keepAlive: boolean
  typeCheck: boolean
  watch: boolean
}

export type StatsAndResults = {
  results: JsonResults[]
  stats: TestStats
}
