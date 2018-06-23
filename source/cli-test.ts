import { findTestMetadata } from './tests'
import { generateTestBundle } from './browser/generateTestBundle'
import tempy from 'tempy'
import { dirname, join, basename } from 'path'
import { writeFileSync } from 'fs'
import { bundleFileOrExit, createIndexHtml } from './browser'
import express from 'express'

async function main(cwd: string, port: number) {
  const testMetadata = await findTestMetadata()
  const outDir = tempy.directory()
  const input = join(outDir, basename(tempy.file({ extension: 'ts' })))
  const output = join(outDir, basename(tempy.file({ extension: 'js' })))
  const browserApiFile = generateTestBundle(dirname(input), testMetadata)
  const indexOut = join(outDir, 'index.html')

  writeFileSync(input, browserApiFile)
  await bundleFileOrExit(cwd, input, output)
  writeFileSync(indexOut, createIndexHtml(basename(output)))

  const app = express()

  app.use(express.static(outDir))

  app.listen(port, '0.0.0.0', () => {
    console.log(`Listening on port ${port}!`)
    process.exit(1)
  })
}

main(process.cwd(), 3000)
