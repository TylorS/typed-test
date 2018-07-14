import * as fs from 'fs'
import { CompilerOptions, findConfigFile } from 'typescript'
import { transpileFile } from '../typescript/transpileFile'
import { Options } from './types'

export function findTypedTestConfigs(
  compilerOptions: CompilerOptions,
  cwd: string = process.cwd(),
): Options[] {
  const configPath = findConfigFile(
    cwd,
    (fileName: string) => fs.existsSync(fileName),
    '.typed-test.ts',
  )

  if (!configPath) {
    return [{}]
  }

  const configContents = fs.readFileSync(configPath).toString()
  const { content } = transpileFile(configContents, compilerOptions, cwd)
  // tslint:disable-next-line:no-eval
  const configModule = eval(content)

  return configModule.default ? toArrayIfNot(configModule.default) : toArrayIfNot(configModule)
}

function toArrayIfNot<A>(x: A | Array<A>): Array<A> {
  return Array.isArray(x) ? x : [x]
}
