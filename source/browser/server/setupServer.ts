import express from 'express'
import { TestStats } from '../../results'
import { JsonResults, Logger } from '../../types'
import { clear } from './clear'
import { error } from './error'
import { log } from './log'
import { results } from './results'

export function setupServer(
  logger: Logger,
  outputDirectory: string,
  cb: (results: JsonResults[], stats: TestStats) => void,
) {
  const app = express()

  app.use(express.static(outputDirectory))
  app.use(express.json())

  app.post('/results', results(cb))
  app.post('/log', log(logger))
  app.post('/error', error(logger))
  app.get('/clear', clear(logger))

  return app
}
