import { isAbsolute, join } from 'path'
import { CompilerOptions, createProgram, Program, Symbol } from 'typescript'
import { TestMetadata } from '../types'
import { findNode } from '../typescript/findNode'
import { isTypedTestTestInterface } from '../typescript/isTypedTestTestInterface'
import { registerTsPaths } from '../typescript/registerTsPaths'
import { transpileNode } from '../typescript/transpileNode'
import { parseTestMetadata } from './parseTestMetadata'

export async function findTestMetadata(
  cwd: string,
  sourcePaths: string[],
  compilerOptions: CompilerOptions,
  mode: 'node' | 'browser',
): Promise<TestMetadata[]> {
  if (mode === 'node') {
    registerTsPaths(compilerOptions)
    transpileNode(process.cwd(), compilerOptions)
  }

  const metadata = await findMetadata(cwd, sourcePaths, compilerOptions)

  return metadata
}

async function findMetadata(
  cwd: string,
  sourcePaths: string[],
  compilerOptions: CompilerOptions,
): Promise<TestMetadata[]> {
  const program = createProgram(sourcePaths, compilerOptions)
  const { typeChecker, sourceFiles } = programData(program)
  const absoluteSourcePaths = sourcePaths.map(x => join(cwd, x))
  const typedTestInterface = await findNode(isTypedTestTestInterface(typeChecker), sourceFiles)
  const typedTestSymbol = typeChecker.getTypeAtLocation(typedTestInterface).getSymbol() as Symbol
  const userSourceFiles = sourceFiles.filter(
    ({ fileName }) =>
      isAbsolute(fileName)
        ? absoluteSourcePaths.includes(fileName)
        : absoluteSourcePaths.includes(join(cwd, fileName)),
  )

  return parseTestMetadata(userSourceFiles, typedTestSymbol, typeChecker)
}

function programData(program: Program) {
  return {
    typeChecker: program.getTypeChecker(),
    sourceFiles: program.getSourceFiles(),
  }
}
