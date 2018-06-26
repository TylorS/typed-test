import express from 'express'
import { writeFileSync } from 'fs'
import { basename, dirname, join } from 'path'
import tempy from 'tempy'
import { bundleFileOrExit, createIndexHtml } from './browser'
import { generateTestBundle } from './browser/generateTestBundle'
import { results } from './browser/server'
import { findTestMetadata } from './tests'

async function main(cwd: string, port: number) {
  const testMetadata = await findTestMetadata()
  const outDir = tempy.directory()
  const input = join(outDir, basename(tempy.file({ extension: 'ts' })))
  const output = join(outDir, basename(tempy.file({ extension: 'js' })))
  const browserApiFile = generateTestBundle(dirname(input), port, testMetadata)
  const indexOut = join(outDir, 'index.html')

  writeFileSync(input, browserApiFile)
  await bundleFileOrExit(cwd, input, output)
  writeFileSync(indexOut, createIndexHtml(basename(output)))

  const app = express()

  app.use(express.static(outDir))
  app.use(express.json())

  app.post('/results', results)

  app.listen(port, '0.0.0.0', () => {
    console.log(`Listening on port ${port}!`)
    // process.exit(1)
  })
}

main(process.cwd(), 3000)
