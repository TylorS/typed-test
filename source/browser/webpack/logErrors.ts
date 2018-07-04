import { Stats } from 'webpack'
import { Logger } from '../../types'

export function logErrors(logger: Logger) {
  return async (err: Error | null, stats: Stats, exit: () => void): Promise<void> => {
    if (err) {
      await logger.error(err.stack || err.message)

      exit()
    }

    if (stats.hasErrors()) {
      for (const e of stats.toJson().errors) {
        await logger.error(e)
      }

      exit()
    }
  }
}
