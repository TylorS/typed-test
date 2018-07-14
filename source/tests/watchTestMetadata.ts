import { all } from 'clear-require'
import { relative } from 'path'
import * as ts from 'typescript'
import { CompilerOptions } from 'typescript'
import { getScriptFileNames } from '../cli/getScriptFileNames'
import { Logger, TestMetadata } from '../types'
import { createLanguageService } from '../typescript/createLanguageService'
import { registerTsPaths } from '../typescript/registerTsPaths'
import { transpileNode } from '../typescript/transpileNode'
import { findMetadataFromProgram } from './findMetadataFromProgram'
import { makeAbsolute } from '../common/makeAbsolute'
import { isTypedTestTestInterface } from '../typescript/isTypedTestTestInterface'
import { findNode } from '../typescript/findNode'
import { parseTestMetadata } from './parseTestMetadata'
// tslint:disable-next-line:no-var-requires
const watch = require('glob-watcher')

export function watchTestMetadata(
  cwd: string,
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  mode: 'node' | 'browser',
  logger: Logger,
  removeFile: (filePath: string) => void,
  cb: (metadata: TestMetadata[]) => void,
): Promise<{ dispose: () => void }> {
  if (mode === 'node') {
    registerTsPaths(compilerOptions)
    transpileNode(cwd, compilerOptions)
  }

  return watchMetadata(cwd, fileGlobs, compilerOptions, mode, logger, cb, removeFile)
}

async function watchMetadata(
  cwd: string,
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  mode: 'node' | 'browser',
  logger: Logger,
  cb: (metadata: TestMetadata[]) => void,
  removeFile: (filePath: string) => void,
): Promise<{ dispose: () => void }> {
  const files: ts.MapLike<{ version: number }> = {}
  const filePaths = getScriptFileNames(cwd, fileGlobs).map(x => makeAbsolute(cwd, x))

  filePaths.forEach(filePath => {
    files[filePath] = { version: 0 }
  })

  const services = createLanguageService(cwd, fileGlobs, compilerOptions, files)
  const program = services.getProgram()
  const typeChecker = program.getTypeChecker()
  const typedTestInterface = await findNode(
    isTypedTestTestInterface(typeChecker),
    program.getSourceFiles(),
  )
  const typedTestSymbol = typeChecker.getTypeAtLocation(typedTestInterface).getSymbol() as ts.Symbol

  async function updateFile(filePath: string, added: boolean) {
    clear(mode)

    if (added) {
      files[filePath] = { version: 0 }
    } else {
      files[filePath].version++
    }

    const program = services.getProgram() // required - side-effectful
    const userSourceFiles = program
      .getSourceFiles()
      .filter(x => makeAbsolute(cwd, x.fileName) === filePath)

    if (userSourceFiles.length === 0) return

    logger.log('Updating ' + relative(cwd, filePath))

    const metadata = parseTestMetadata(userSourceFiles, typedTestSymbol, typeChecker).map(m => ({
      ...m,
      filePath: makeAbsolute(cwd, m.filePath),
    }))

    cb(metadata)
  }

  const watcher = watch(fileGlobs, { cwd })

  await logger.log('Finding metadata...')

  return findMetadataFromProgram(filePaths, services.getProgram())
    .then(cb)
    .then(() => {
      watcher.on('change', (filePath: string) => updateFile(makeAbsolute(cwd, filePath), false))
      watcher.on('add', (filePath: string) => updateFile(makeAbsolute(cwd, filePath), true))

      // On file deleted
      watcher.on('unlink', (filePath: string) => {
        if (mode === 'node') {
          all()
        }

        const absolutePath = makeAbsolute(cwd, filePath)

        if (files[absolutePath]) {
          delete files[absolutePath]
        }

        removeFile(absolutePath)
      })

      return { dispose: () => watcher.close() }
    })
}

function clear(mode: 'node' | 'browser') {
  if (mode === 'node') {
    all()
  }
}
