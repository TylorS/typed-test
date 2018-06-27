import { flatten } from '../common/flatten'
import { resultsToDom } from '../results'
import { TestsWithResults } from '../types'

const ROOT_ELEMENT_SELECTOR = '#root'

export function reportResults(results: TestsWithResults[]): Promise<void> {
  const rootElement = document.querySelector(ROOT_ELEMENT_SELECTOR)

  if (rootElement) {
    const testResults = flatten(results.map(x => x.results))

    rootElement.appendChild(resultsToDom(testResults))
  }

  return fetch(`/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results),
  }).then(() => void 0)
}
