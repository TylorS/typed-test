import { Request, Response } from 'express'

export function error(request: Request, response: Response) {
  console.error(request.body.msg)

  return response.status(200).send()
}
