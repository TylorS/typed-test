import { Request, Response } from 'express'
import { Logger } from '../../types'

export function error(logger: Logger) {
  return async (request: Request, response: Response) => {
    await logger.error(request.body.msg)

    return response.status(200).send()
  }
}
