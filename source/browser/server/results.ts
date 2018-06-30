import { Request, Response } from 'express'
import { getTestResults, getTestStats, TestStats } from '../../results'
import { JsonResults } from '../types'

export function results(cb: (results: JsonResults[], stats: TestStats) => void) {
  return (request: Request, response: Response) => {
    const jsonResults: JsonResults[] = request.body
    const stats = getTestStats(getTestResults(jsonResults))

    cb(jsonResults, stats)

    response.status(200).send()
  }
}
