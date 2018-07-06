import { all } from 'clear-require'
import { isAbsolute, join, relative } from 'path'
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
  const filePaths = getScriptFileNames(cwd, fileGlobs).map(x => makeAbsolute(cwd, x))

  filePaths.forEach(filePath => {
    files[filePath] = { version: 0 }
  })

  const services = createLanguageService(cwd, fileGlobs, compilerOptions, files)
  const queue: string[] = []
  let id: NodeJS.Timer
  let running: boolean = false

  const delay = mode === 'browser' ? 1000 : 200
  const run = async () => {
    running = true

    const metadata = await findMetadataFromProgram(
      queue.splice(0, queue.length),
      services.getProgram(),
    )

    cb(metadata)

    running = false

    if (queue.length > 0) {
      scheduleNextRun()
    }
  }

  function scheduleNextRun() {
    id = setTimeout(run, delay)
  }

  function clear() {
    if (id) {
      clearTimeout(id)
    }

    if (mode === 'node') {
      all()
    }
  }

  function updateFile(filePath: string, added: boolean) {
    logger.log('Updating ' + relative(cwd, filePath))
    clear()

    if (added) {
      files[filePath] = { version: 0 }
    } else {
      files[filePath].version++
    }

    queue.push(filePath)

    if (!running) {
      scheduleNextRun()
    }
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

      return watcher
    })
}

function makeAbsolute(cwd: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(cwd, filePath)
}
