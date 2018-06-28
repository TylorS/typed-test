import { Request, Response } from 'express'

export function clear(_: Request, response: Response) {
  console.log('\x1Bc')

  return response.status(200).send()
}
