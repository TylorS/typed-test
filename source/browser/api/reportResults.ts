import { getTestResults, resultsToDom } from '../../results'
import { TestResult, TestsWithResults } from '../../types'
import { ROOT_ELEMENT_ID } from '../constants'

export function reportResults(results: TestsWithResults[]): Promise<void> {
  const rootElement = document.getElementById(ROOT_ELEMENT_ID)

  if (rootElement) {
    clearChildren(rootElement)
    addResults(rootElement, getTestResults(results))
  }

  return sendResultsToServer(results)
}

function clearChildren(rootElement: HTMLElement) {
  const { childNodes } = rootElement
  const childCount = childNodes.length

  for (let i = 0; i < childCount; ++i) {
    rootElement.removeChild(childNodes[i])
  }

  return rootElement
}

function addResults(rootElement: HTMLElement, results: TestResult[]) {
  rootElement.appendChild(resultsToDom(results))

  return rootElement
}

function sendResultsToServer(results: TestsWithResults[]) {
  return fetch(`/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results),
  }).then(() => void 0)
}
