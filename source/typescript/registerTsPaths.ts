import { register } from 'tsconfig-paths'
import { CompilerOptions } from 'typescript'

export function registerTsPaths(options: CompilerOptions): CompilerOptions {
  const { baseUrl, paths } = options

  if (baseUrl && paths) {
    register({
      baseUrl,
      paths,
    })
  }

  return options
}
