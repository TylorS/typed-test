import * as fs from 'fs'
import { CompilerOptions, findConfigFile } from 'typescript'
import { transpileFile } from '../typescript/transpileFile'
import { Options } from './types'

export function findTypedTestConfig(
  compilerOptions: CompilerOptions,
  cwd: string = process.cwd(),
): Options {
  const configPath = findConfigFile(
    cwd,
    (fileName: string) => fs.existsSync(fileName),
    '.typed-test.ts',
  )

  if (!configPath) {
    return {}
  }

  const configContents = fs.readFileSync(configPath).toString()
  const { content } = transpileFile(configContents, compilerOptions, cwd)
  // tslint:disable-next-line:no-eval
  const configModule = eval(content)

  return configModule.default ? configModule.default : configModule
}
