import { Request, Response } from 'express'
import { getTestResults, getTestStats, TestStats } from '../../results'
import { JsonResults, TestResult } from '../../types'

export function results(cb: (results: JsonResults[], stats: TestStats) => void) {
  return (request: Request, response: Response) => {
    const body: JsonResults[] = request.body
    const jsonResults = body.map(x => ({ ...x, results: x.results.map(convertBackToError) }))
    const stats = getTestStats(getTestResults(jsonResults))

    cb(jsonResults, stats)

    response.status(200).send()
  }
}

function convertBackToError(testResult: TestResult): TestResult {
  switch (testResult.type) {
    case 'pass':
    case 'skip':
      return testResult
    case 'fail':
      return { ...testResult, error: toError(testResult.error) }
  }

  return {
    ...testResult,
    results: testResult.results.map(convertBackToError),
  }
}

function toError(errLikeObject: Error) {
  const error = new Error(errLikeObject.message)

  Object.keys(errLikeObject).forEach(key => {
    ;(error as any)[key] = (errLikeObject as any)[key]
  })

  return error
}
