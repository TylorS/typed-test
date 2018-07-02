import { Browsers } from '../browser/openBrowser'
import { JsonResults } from '../browser/types'
import { TestStats } from '../results'

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
