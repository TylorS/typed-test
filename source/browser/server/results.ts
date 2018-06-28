import { Request, Response } from 'express'
import { blue, green, red } from 'typed-colors'
import { getTestResults, getTestStats, resultsToString, TestStats } from '../../results'
import { JsonResults } from '../types'

export function results(once: boolean) {
  return (request: Request, response: Response) => {
    const body: JsonResults[] = request.body
    const testResults = getTestResults(body)
    const stats = getTestStats(testResults)

    console.log(resultsToString(testResults))
    console.log(statsToString(stats))

    response.status(200).send()

    if (once) {
      const exitCode = stats.failing > 0 ? 1 : 0

      process.exit(exitCode)
    }
  }
}

function statsToString({ passing, failing, skipped }: TestStats): string {
  let str = `\n${green(String(passing))} Passed`

  if (failing > 0) {
    str += ` - ${red(String(failing))} Failed`
  }

  if (skipped > 0) {
    str += ` - ${blue(String(skipped))} Skipped`
  }

  return str + `\n`
}
