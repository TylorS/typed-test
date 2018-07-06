import { existsSync, readFileSync } from 'fs'
import { isAbsolute, join } from 'path'
import * as ts from 'typescript'
import { getScriptFileNames } from '../cli/getScriptFileNames'

export function createLanguageService(
  cwd: string,
  fileGlobs: string[],
  compilerOptions: ts.CompilerOptions,
  files: ts.MapLike<{ version: number }>,
): ts.LanguageService {
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => getScriptFileNames(cwd, fileGlobs),
    getScriptVersion: fileName => {
      const key = isAbsolute(fileName) ? fileName : join(cwd, fileName)

      return files[key] && files[key].version.toString()
    },
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

  return ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
}
