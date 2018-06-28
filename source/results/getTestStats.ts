import { TestResult } from '../types'

export type TestStats = {
  readonly passing: number
  readonly failing: number
  readonly skipped: number
}

const defaultStats = { passing: 0, failing: 0, skipped: 0 }

export function getTestStats(testResults: TestResult[], seed: TestStats = defaultStats): TestStats {
  return testResults.reduce(getStat, seed)
}

function getStat(stats: TestStats, result: TestResult): TestStats {
  if (result.type === 'group') {
    return getTestStats(result.results, stats)
  }

  if (result.type === 'fail') {
    return failed(stats)
  }

  if (result.type === 'skip') {
    return skipped(stats)
  }

  return passed(stats)
}

function passed(stats: TestStats): TestStats {
  return {
    ...stats,
    passing: stats.passing + 1,
  }
}

function failed(stats: TestStats): TestStats {
  return {
    ...stats,
    failing: stats.failing + 1,
  }
}

function skipped(stats: TestStats): TestStats {
  return {
    ...stats,
    skipped: stats.skipped + 1,
  }
}
