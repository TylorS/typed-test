import { CompilerOptions, transpileModule } from 'typescript'
import { diagnosticsToString } from '.'

export function transpileFile(
  contents: string,
  options: CompilerOptions,
  basePath: string,
): { content: string; sourceMap: string } {
  const { outputText, diagnostics, sourceMapText = '' } = transpileModule(contents, {
    compilerOptions: { ...options, sourceMap: true },
  })

  if (diagnostics && diagnostics.length > 0) {
    throw new Error(diagnosticsToString(diagnostics, basePath))
  }

  return {
    content: outputText,
    sourceMap: sourceMapText,
  }
}
