import { chain } from '../common/flatten'
import { getTestStats, resultsToString, statsToString } from '../results'
import { JsonResults, Logger } from '../types'
import { ProcessResults } from '../typescript/typeCheckInAnotherProcess'

export async function logResults(logger: Logger, cwd: string, results: JsonResults[]) {
  const stats = getTestStats(chain(x => x.results, results))

  await logger.log(resultsToString(cwd, results))
  await logger.log(statsToString(stats))

  return results
}

export async function logTypeCheckResults(
  logger: Logger,
  { exitCode = 0, stderr = '', stdout = '' }: Partial<ProcessResults>,
) {
  if (stdout) {
    await logger.log(stdout.trim())
  }

  if (exitCode > 0 && stderr) {
    await logger.error(stderr.trim())
  }
}
