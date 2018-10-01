import * as clear from 'clear-require'
import { CompilerOptions, Program } from 'typescript'
import { getScriptFileNames } from '../cli/getScriptFileNames'
import { TestMetadata } from '../types'
import { createLanguageService } from '../typescript/createLanguageService'
import { registerTsPaths } from '../typescript/registerTsPaths'
import { transpileNode } from '../typescript/transpileNode'
import { findMetadataFromProgram } from './findMetadataFromProgram'

export async function findTestMetadata(
  cwd: string,
  fileGlobs: string[],
  compilerOptions: CompilerOptions,
  mode: 'node' | 'browser',
): Promise<TestMetadata[]> {
  if (mode === 'node') {
    registerTsPaths(compilerOptions)
    transpileNode(cwd, compilerOptions)
    clear.all()
  }

  const services = createLanguageService(cwd, fileGlobs, compilerOptions, {})
  const filePaths = getScriptFileNames(cwd, fileGlobs)
  const program = services.getProgram() as Program
  const metadata = await findMetadataFromProgram(filePaths, program)

  return metadata
}
