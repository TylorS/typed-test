import { getTestResults, resultsToDom } from '../../results'
import { TestResult, TestsWithResults } from '../../types'
import { ROOT_ELEMENT_ID } from '../constants'
// tslint:disable-next-line:no-var-requires
const { mapStackTrace } = require('sourcemapped-stacktrace')

export function reportResults(results: TestsWithResults[], cwd: string): Promise<void> {
  const rootElement = document.getElementById(ROOT_ELEMENT_ID)

  if (rootElement) {
    clearChildren(rootElement)
    addResults(rootElement, getTestResults(results))
  }

  return sendResultsToServer(results, cwd)
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
async function sendResultsToServer(results: TestsWithResults[], cwd: string) {
  const jsonReadyResults = await prepareTestResults(results, cwd)

  await fetch(`/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonReadyResults),
  })
}

async function prepareTestResults(
  results: TestsWithResults[],
  cwd: string,
): Promise<TestsWithResults[]> {
  const jsonReadyResults: TestsWithResults[] = []

  for (const result of results) {
    jsonReadyResults.push({ ...result, results: await prepareResults(result.results, cwd) })
  }

  return jsonReadyResults
}

async function prepareResults(results: TestResult[], cwd: string): Promise<TestResult[]> {
  const jsonReadyResults: TestResult[] = []

  for (const result of results) {
    jsonReadyResults.push(await prepareResult(result, cwd))
  }

  return jsonReadyResults
}

async function prepareResult(result: TestResult, cwd: string): Promise<TestResult> {
  switch (result.type) {
    case 'pass':
    case 'skip':
      return result
    case 'fail': {
      const error = await prepareError(result.error, cwd)
      return { ...result, error } as TestResult
    }
  }

  const results = await prepareResults(result.results, cwd)

  return {
    ...result,
    results,
  }
}

async function prepareError(error: Error, cwd: string): Promise<Error> {
  return {
    message: error.message,
    stack: error.stack && (await sourceMapStack(error.stack, cwd)),
    ...error,
  }
}

async function sourceMapStack(stack: string, cwd: string): Promise<string> {
  return new Promise<string>(resolve => {
    mapStackTrace(stack, (trace: string[]) =>
      resolve(trace.join(`\n`).replace(/webpack:\/\/TypedTest/g, cwd)),
    )
  })
}
