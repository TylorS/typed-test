import { Request, Response } from 'express'

export function log(request: Request, response: Response) {
  console.log(request.body.msg)

  return response.status(200).send()
}
