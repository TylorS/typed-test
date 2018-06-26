import { Request, Response } from 'express'
import { flatten } from '../../common/flatten'
import { resultToString } from '../../results'
import { JsonResults } from '../types'

export function results(request: Request, response: Response) {
  console.log('\x1Bc')

  console.log(`@typed/test ${new Date().toLocaleString()}`)
  const body: JsonResults[] = request.body
  // tslint:disable-next-line:no-shadowed-variable
  const results = flatten(body.map(x => x.results))
  const result = results.map(x => resultToString(x)).join(`\n`)

  console.log(result)

  return response.status(200).send()
}
