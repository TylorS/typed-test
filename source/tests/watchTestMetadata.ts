import * as clear from 'clear-require'
import * as ts from 'typescript'
import { CompilerOptions } from 'typescript'
import { getScriptFileNames } from '../cli/getScriptFileNames'
import { Logger, TestMetadata } from '../types'
import { createLanguageService } from '../typescript/createLanguageService'
import { registerTsPaths } from '../typescript/registerTsPaths'
import { transpileNode } from '../typescript/transpileNode'
import { findMetadataFromProgram } from './findMetadataFromProgram'
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
): Promise<{ close: () => void }> {
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
) {
  const files: ts.MapLike<{ version: number }> = {}
  const services = createLanguageService(cwd, fileGlobs, compilerOptions, files)

  function findMetadataByFilePath(filePath: string) {
    if (mode === 'node') {
      clear.all()
    }

    const relativeFilePath = dropCwd(cwd, filePath)

    if (!getScriptFileNames(cwd, fileGlobs).some(x => x.indexOf(relativeFilePath) > -1)) {
      return
    }

    findMetadataFromProgram([relativeFilePath], services.getProgram()).then(cb)
  }

  const watcher = watch(fileGlobs, { cwd })

  await logger.log('Finding metadata...')
  const filePaths = getScriptFileNames(cwd, fileGlobs)
  return findMetadataFromProgram(filePaths, services.getProgram())
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
