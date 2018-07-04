import { JsonResults } from '../browser/types'
import { chain } from '../common/flatten'
import { getTestStats, resultsToString, statsToString } from '../results'
import { ProcessResults } from '../typescript/typeCheckInAnotherProcess'

export function logResults(cwd: string, results: JsonResults[]) {
  const stats = getTestStats(chain(x => x.results, results))

  console.log(resultsToString(cwd, results))
  console.log(statsToString(stats))

  return results
}

export function logTypeCheckResults({
  exitCode = 0,
  stderr = '',
  stdout = '',
}: Partial<ProcessResults>) {
  if (stdout) {
    console.log(stdout.trim())
  }

  if (exitCode > 0 && stderr) {
    console.error(stderr.trim())
  }
}
