import { CompilerOptions, transpileModule } from 'typescript'
import { diagnosticsToString } from './diagnosticToString'

export function transpileFile(
  contents: string,
  options: CompilerOptions,
  basePath: string,
  moduleName: string,
): { content: string; sourceMap: string } {
  const { outputText, diagnostics, sourceMapText = '' } = transpileModule(contents, {
    compilerOptions: { ...options, sourceMap: true },
    moduleName,
  })

  if (diagnostics && diagnostics.length > 0) {
    throw new Error(diagnosticsToString(diagnostics, basePath))
  }

  return {
    content: outputText,
    sourceMap: sourceMapText,
  }
}
