import { isAbsolute, join } from 'path'
import { register } from 'ts-node'
import { CompilerOptions, createProgram, Program, Symbol } from 'typescript'
import { TestMetadata } from '../types'
import { findNode, isTypedTestTestInterface, registerTsPaths } from '../typescript'
import { parseTestMetadata } from './parseTestMetadata'

export async function findTestMetadata(
  sourcePaths: string[],
  compilerOptions: CompilerOptions,
  mode: 'node' | 'browser',
): Promise<TestMetadata[]> {
  if (mode === 'node') {
    registerTsPaths(compilerOptions)
    register({ transpileOnly: true })
  }

  const metadata = await findMetadata(sourcePaths, compilerOptions)

  return metadata
}

async function findMetadata(
  sourcePaths: string[],
  compilerOptions: CompilerOptions,
): Promise<TestMetadata[]> {
  const program = createProgram(sourcePaths, compilerOptions)
  const { currentDirectory, typeChecker, sourceFiles } = programData(program)
  const absoluteSourcePaths = sourcePaths.map(x => join(currentDirectory, x))
  const typedTestInterface = await findNode(isTypedTestTestInterface(typeChecker), sourceFiles)
  const typedTestSymbol = typeChecker.getTypeAtLocation(typedTestInterface).getSymbol() as Symbol
  const userSourceFiles = sourceFiles.filter(
    ({ fileName }) =>
      isAbsolute(fileName)
        ? absoluteSourcePaths.includes(fileName)
        : absoluteSourcePaths.includes(join(currentDirectory, fileName)),
  )

  return parseTestMetadata(userSourceFiles, typedTestSymbol, typeChecker)
}

function programData(program: Program) {
  return {
    typeChecker: program.getTypeChecker(),
    currentDirectory: program.getCurrentDirectory(),
    sourceFiles: program.getSourceFiles(),
  }
}
