import { Diagnostic, Program } from 'typescript'
import { diagnosticToString } from './diagnosticToString'

export function typeCheckFiles(program: Program): string {
  return program
    .getSourceFiles()
    .reduce((xs, x) => xs.concat(program.getSemanticDiagnostics(x)), [] as Diagnostic[])
    .map(x => diagnosticToString(x, program.getCurrentDirectory()))
    .join('\n')
}
