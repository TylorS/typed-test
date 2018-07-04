import { Request, Response } from 'express'
import { Logger } from '../../types'

export function clear(logger: Logger) {
  return async (_: Request, response: Response) => {
    await logger.log('\x1Bc')

    return response.status(200).send()
  }
}
