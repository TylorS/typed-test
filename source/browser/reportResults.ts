import { TestsWithResults } from '../types'

export function reportResults(results: TestsWithResults[]): Promise<void> {
  return fetch(`/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results),
  }).then(() => void 0)
}
