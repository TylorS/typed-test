import { TestsWithResults } from '../types'

export async function reportResults(results: TestsWithResults[]): Promise<void> {
  console.log(results)
}
