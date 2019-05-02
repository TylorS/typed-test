import * as fs from 'fs'
import { basename, dirname, join } from 'path'
import {
  CompilerOptions,
  convertCompilerOptionsFromJson,
  findConfigFile,
  parseConfigFileTextToJson,
} from 'typescript'
import { diagnosticToString } from './diagnosticToString'

export type TsConfig = {
  compilerOptions: CompilerOptions
  configPath: string
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

  const baseConfig = parseConfigFile(cwd, configPath)

  if (baseConfig.extends) {
    const extensions = Array.isArray(baseConfig.extends) ? baseConfig.extends : [baseConfig.extends]
    const extendedConfigPaths = extensions.map(ext => join(dirname(configPath), ext))
    const extendedConfigs = extendedConfigPaths.map(path => parseConfigFile(cwd, path))

    if (extendedConfigs.length === 1) {
      return mergeConfigs(baseConfig, extendedConfigs[0])
    }

    return extendedConfigs.reduceRight(mergeConfigs)
  }

  return baseConfig
}

function mergeConfigs(base: TsConfig, extension: TsConfig): TsConfig {
  return {
    ...extension,
    ...base,
    compilerOptions: {
      ...extension.compilerOptions,
      ...base.compilerOptions,
    },
  }
}

function parseConfigFile(cwd: string, filePath: string): TsConfig {
  const fileName = basename(filePath)
  const contents = fs.readFileSync(filePath).toString()
  const { config } = parseConfigFileTextToJson(filePath, contents)
  const { options, errors } = convertCompilerOptionsFromJson(config.compilerOptions, cwd, fileName)

  if (errors && errors.length > 0) {
    throw new Error(errors.map(x => diagnosticToString(x, cwd)).join('\n'))
  }

  return { ...config, compilerOptions: options, configFilePath: filePath }
}
