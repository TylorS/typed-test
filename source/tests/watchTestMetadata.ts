import * as clear from 'clear-require'
import { existsSync, readFileSync } from 'fs'
import { sync } from 'glob'
import { isAbsolute, join } from 'path'
import { register } from 'ts-node'
import { CompilerOptions } from 'typescript'
import * as ts from 'typescript'
import { flatten } from '../common/flatten'
import { TestMetadata } from '../types'
import { findNode } from '../typescript/findNode'
import { isTypedTestTestInterface } from '../typescript/isTypedTestTestInterface'
import { registerTsPaths } from '../typescript/registerTsPaths'
import { parseTestMetadata } from './parseTestMetadata'
// tslint:disable-next-line:no-var-requires
const watch = require('glob-watcher')

export function watchTestMetadata(
  configPath: string,
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  mode: 'node' | 'browser',
  removeFile: (filePath: string) => void,
  cb: (metadata: TestMetadata[]) => void,
): void {
  if (mode === 'node') {
    registerTsPaths(compilerOptions)
    register({ transpileOnly: true })
  }

  watchMetadata(configPath, fileGlobs, compilerOptions, mode, cb, removeFile)
}

async function watchMetadata(
  configPath: string,
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  mode: 'node' | 'browser',
  cb: (metadata: TestMetadata[]) => void,
  removeFile: (filePath: string) => void,
) {
  const files: ts.MapLike<{ version: number }> = {}

  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.")
  }

  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => flatten(fileGlobs.map(x => sync(x))),
    getScriptVersion: fileName => files[fileName] && files[fileName].version.toString(),
    getScriptSnapshot: fileName => {
      if (!existsSync(fileName)) {
        return undefined
      }

      return ts.ScriptSnapshot.fromString(readFileSync(fileName).toString())
    },
    getCurrentDirectory: () => process.cwd(),
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

  const watcher = watch(fileGlobs)

  console.log('Finding metadata...')
  findMetadata(servicesHost.getScriptFileNames(), services.getProgram())
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
