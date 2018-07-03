import { createHash } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import { directory } from 'tempy'
import { CompilerOptions, transpileModule } from 'typescript'
import { diagnosticsToString } from './diagnosticToString'
// tslint:disable-next-line:no-var-requires
const sourceMapSupport = require('source-map-support')

const DEFAULT_COMPILER_OPTIONS = {
  sourceMap: true,
  inlineSourceMap: false,
  inlineSources: true,
  declaration: false,
  noEmit: false,
  outDir: '$$ts-transpilation$$',
}

export interface Register {
  cwd: string
  extensions: string[]
  cacheDirectory: string
  compile(code: string, fileName: string): string
}

export function transpileNode(cwd: string, compilerOptions: CompilerOptions) {
  compilerOptions = { ...compilerOptions, ...DEFAULT_COMPILER_OPTIONS }
  const cacheDirectory = directory()
  const originalJsHandler = require.extensions['.js']
  const memoryCache = {
    contents: Object.create(null),
    outputs: Object.create(null),
  }
  const extensions = ['.ts', '.tsx']

  const compile = (code: string, fileName: string): [string, string] => {
    const result = transpileModule(code, {
      fileName,
      compilerOptions,
      reportDiagnostics: true,
    })

    const diagnosticList = result.diagnostics

    if (diagnosticList && diagnosticList.length) {
      throw new Error(diagnosticsToString(diagnosticList, cwd))
    }

    return [result.outputText, result.sourceMapText as string]
  }

  sourceMapSupport.install({
    environment: 'node',
    retrieveFile(path: string) {
      return memoryCache.outputs[path]
    },
  })

  const register: Register = {
    cwd,
    cacheDirectory,
    extensions,
    compile: readThrough(cacheDirectory, memoryCache, compile, extname),
  }

  extensions.forEach(extension => {
    registerExtension(extension, register, originalJsHandler)
  })
}

function readThrough(
  cachedir: string,
  memoryCache: { contents: Record<string, string>; outputs: Record<string, string> },
  compile: (code: string, fileName: string, lineOffset?: number) => [string, string],
  getExtension: (fileName: string) => string,
) {
  // Make sure the cache directory exists before continuing.

  return (code: string, fileName: string) => {
    const cachePath = join(cachedir, getCacheName(code, fileName))
    const extension = getExtension(fileName)
    const outputPath = `${cachePath}${extension}`

    try {
      const contents = readFileSync(outputPath, 'utf8')
      if (isValidCacheContent(contents)) {
        memoryCache.outputs[fileName] = contents

        return contents
      }
    } catch (err) {
      /* Ignore. */
    }

    const [value, sourceMap] = compile(code, fileName)
    const output = updateOutput(value, fileName, sourceMap, getExtension)

    memoryCache.outputs[fileName] = output
    writeFileSync(outputPath, output)

    return output
  }
}

function updateOutput(
  outputText: string,
  fileName: string,
  sourceMap: string,
  getExtension: (fileName: string) => string,
) {
  const base64Map = Buffer.from(updateSourceMap(sourceMap, fileName), 'utf8').toString('base64')
  const sourceMapContent = `data:application/json;charset=utf-8;base64,${base64Map}`
  const sourceMapLength =
    `${basename(fileName)}.map`.length + (getExtension(fileName).length - extname(fileName).length)

  return outputText.slice(0, -sourceMapLength) + sourceMapContent
}

function updateSourceMap(sourceMapText: string, fileName: string) {
  const sourceMap = JSON.parse(sourceMapText)
  sourceMap.file = fileName
  sourceMap.sources = [fileName]
  delete sourceMap.sourceRoot
  return JSON.stringify(sourceMap)
}

function isValidCacheContent(contents: string) {
  return /(?:9|0=|Q==)$/.test(contents.slice(-3))
}

function getCacheName(sourceCode: string, fileName: string) {
  return createHash('sha256')
    .update(extname(fileName), 'utf8')
    .update('\x00', 'utf8')
    .update(sourceCode, 'utf8')
    .digest('hex')
}

function registerExtension(
  ext: string,
  register: Register,
  originalHandler: (m: NodeModule, filename: string) => any,
) {
  const old = require.extensions[ext] || originalHandler

  require.extensions[ext] = (m: any, filename) => {
    const _compile = m._compile

    m._compile = function(code: string, fileName: string) {
      return _compile.call(this, register.compile(code, fileName), fileName)
    }

    return old(m, filename)
  }
}
