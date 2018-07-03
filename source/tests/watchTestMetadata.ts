import * as clear from 'clear-require'
import { existsSync, readFileSync } from 'fs'
import { sync } from 'glob'
import { isAbsolute, join } from 'path'
import * as ts from 'typescript'
import { CompilerOptions } from 'typescript'
import { flatten } from '../common/flatten'
import { TestMetadata } from '../types'
import { findNode } from '../typescript/findNode'
import { isTypedTestTestInterface } from '../typescript/isTypedTestTestInterface'
import { registerTsPaths } from '../typescript/registerTsPaths'
import { transpileNode } from '../typescript/transpileNode'
import { parseTestMetadata } from './parseTestMetadata'
// tslint:disable-next-line:no-var-requires
const watch = require('glob-watcher')

export function watchTestMetadata(
  cwd: string,
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  mode: 'node' | 'browser',
  removeFile: (filePath: string) => void,
  cb: (metadata: TestMetadata[]) => void,
): Promise<{ close: () => void }> {
  if (mode === 'node') {
    registerTsPaths(compilerOptions)
    transpileNode(cwd, compilerOptions)
  }

  return watchMetadata(cwd, fileGlobs, compilerOptions, mode, cb, removeFile)
}

async function watchMetadata(
  cwd: string,
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  mode: 'node' | 'browser',
  cb: (metadata: TestMetadata[]) => void,
  removeFile: (filePath: string) => void,
) {
  const files: ts.MapLike<{ version: number }> = {}
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => flatten(fileGlobs.map(x => sync(x, { cwd }))),
    getScriptVersion: fileName => files[fileName] && files[fileName].version.toString(),
    getScriptSnapshot: fileName => {
      const pathname = isAbsolute(fileName) ? fileName : join(cwd, fileName)

      if (!existsSync(pathname)) {
        return undefined
      }

      return ts.ScriptSnapshot.fromString(readFileSync(pathname).toString())
    },
    getCurrentDirectory: () => cwd,
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
  }
  const services = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
  function findMetadataByFilePath(filePath: string) {
    if (mode === 'node') {
      clear.all()
    }

    const relativeFilePath = dropCwd(servicesHost.getCurrentDirectory(), filePath)

    if (!servicesHost.getScriptFileNames().some(x => x.indexOf(relativeFilePath) > -1)) {
      return
    }

    findMetadata([relativeFilePath], services.getProgram()).then(cb)
  }

  const watcher = watch(fileGlobs, { cwd })

  console.log('Finding metadata...')
  const filePaths = servicesHost.getScriptFileNames()
  return findMetadata(filePaths, services.getProgram())
    .then(cb)
    .then(() => {
      watcher.on('change', findMetadataByFilePath)
      watcher.on('add', findMetadataByFilePath)

      // On file deleted
      watcher.on('unlink', (filePath: string) => {
        if (mode === 'node') {
          clear.all()
        }

        removeFile(filePath)
      })

      return watcher
    })
}

function dropCwd(cwd: string, filePath: string): string {
  const cwdRegex = new RegExp(`${cwd}/`)

  return filePath.replace(cwdRegex, '')
}

async function findMetadata(sourcePaths: string[], program: ts.Program): Promise<TestMetadata[]> {
  const { currentDirectory, typeChecker, sourceFiles } = programData(program)
  const absoluteSourcePaths = sourcePaths.map(x => join(currentDirectory, x))
  const typedTestInterface = await findNode(isTypedTestTestInterface(typeChecker), sourceFiles)
  const typedTestSymbol = typeChecker.getTypeAtLocation(typedTestInterface).getSymbol() as ts.Symbol
  const userSourceFiles = sourceFiles.filter(
    ({ fileName }) =>
      isAbsolute(fileName)
        ? absoluteSourcePaths.includes(fileName)
        : absoluteSourcePaths.includes(join(currentDirectory, fileName)),
  )

  return parseTestMetadata(userSourceFiles, typedTestSymbol, typeChecker)
}

function programData(program: ts.Program) {
  return {
    typeChecker: program.getTypeChecker(),
    currentDirectory: program.getCurrentDirectory(),
    sourceFiles: program.getSourceFiles(),
  }
}
