import express from 'express'
import { clear } from './clear'
import { error } from './error'
import { log } from './log'
import { results } from './results'

export function setupServer(outputDirectory: string, watch: boolean) {
  const app = express()

  app.use(express.static(outputDirectory))
  app.use(express.json())

  app.post('/results', results(!watch))
  app.post('/log', log)
  app.post('/error', error)
  app.get('/clear', clear)

  return app
}
