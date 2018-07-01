import { writeFileSync } from 'fs'
import { basename, join } from 'path'
import * as tempy from 'tempy'
import { TestMetadata } from '../types'
import { createIndexHtml } from './createIndexHtml'
import { generateTestBundle } from './generateTestBundle'
import { bundleFileOrExit } from './webpack'

export async function setupBrowser(
  cwd: string,
  port: number,
  timeout: number,
  testMetadata: TestMetadata[],
) {
  const outputDirectory = tempy.directory()
  const temporaryPath = join(outputDirectory, basename(tempy.file({ extension: 'ts' })))
  const bundlePath = join(outputDirectory, basename(tempy.file({ extension: 'js' })))
  const browserApiFile = generateTestBundle(cwd, outputDirectory, port, timeout, testMetadata)
  const indexHtmlPath = join(outputDirectory, 'index.html')

  writeFileSync(temporaryPath, browserApiFile)
  await bundleFileOrExit(cwd, temporaryPath, bundlePath)
  writeFileSync(indexHtmlPath, createIndexHtml(basename(bundlePath)))

  return { outputDirectory, bundlePath, indexHtmlPath }
}
