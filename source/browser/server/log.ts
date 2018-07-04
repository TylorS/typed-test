import { Request, Response } from 'express'
import { Logger } from '../../types'

export function log(logger: Logger) {
  return async (request: Request, response: Response) => {
    await logger.log(request.body.msg)

    return response.status(200).send()
  }
}
