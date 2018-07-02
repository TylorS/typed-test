import { runTests } from '../common/runTests'
import { collectTests } from '../node/collectTests'
import { getTestResults } from '../results/getTestResults'
import { getTestStats } from '../results/getTestStats'
import { TestMetadata } from '../types'
import { StatsAndResults, TypedTestOptions } from './types'

export async function runNodeTests(
  { timeout }: TypedTestOptions,
  cwd: string,
  testMetadata: TestMetadata[],
): Promise<StatsAndResults> {
  console.log('Running tests...')
  const testsWithResults = await runTests(timeout, collectTests(cwd, testMetadata))
  const testResults = getTestResults(testsWithResults)
  const stats = getTestStats(testResults)

  return { results: testsWithResults, stats }
}
