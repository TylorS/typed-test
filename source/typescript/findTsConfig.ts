import * as fs from 'fs'
import {
  CompilerOptions,
  convertCompilerOptionsFromJson,
  findConfigFile,
  parseConfigFileTextToJson,
} from 'typescript'
import { diagnosticToString } from './diagnosticToString'

export type TsConfig = {
  compilerOptions: CompilerOptions
  extends?: string | string[]
  files?: string[]
  include?: string[]
  exclude?: string[]
}

export function findTsConfig(cwd: string = process.cwd()): TsConfig {
  const configPath = findConfigFile(cwd, (fileName: string) => fs.existsSync(fileName))

  if (!configPath) {
    throw new Error('Unable to find TypeScript configuration')
  }

  const configContents = fs.readFileSync(configPath).toString()
  const { config } = parseConfigFileTextToJson(configPath, configContents)
  const { compilerOptions: unparsedCompilerOptions } = config
  const { options, errors } = convertCompilerOptionsFromJson(
    unparsedCompilerOptions,
    cwd,
    'tsconfig.json',
  )

  if (errors && errors.length > 0) {
    throw new Error(errors.map(x => diagnosticToString(x, cwd)).join('\n'))
  }

  return { ...config, compilerOptions: options }
}
