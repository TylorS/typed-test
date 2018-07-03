import { createMatchPath } from 'tsconfig-paths'
import { CompilerOptions } from 'typescript'

export function registerTsPaths(options: CompilerOptions): CompilerOptions {
  const { baseUrl, paths } = options

  if (baseUrl && paths) {
    const matchPath = createMatchPath(baseUrl, paths)
    // Patch node's module loading
    // tslint:disable-next-line:no-require-imports variable-name
    const Module = require('module')
    const originalResolveFilename = Module._resolveFilename
    // tslint:disable-next-line:no-any
    // tslint:disable-next-line:variable-name
    Module._resolveFilename = function(request: any, _parent: any) {
      const found = matchPath(request)
      if (found) {
        const modifiedArguments = [found].concat([].slice.call(arguments, 1)) // Passes all arguments. Even those that is not specified above.
        // tslint:disable-next-line:no-invalid-this
        return originalResolveFilename.apply(this, modifiedArguments)
      }
      // tslint:disable-next-line:no-invalid-this
      return originalResolveFilename.apply(this, arguments)
    }
  }

  return options
}
