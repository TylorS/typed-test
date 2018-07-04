import { isAbsolute, join } from 'path'
import * as ts from 'typescript'
import { TestMetadata } from '../types'
import { findNode } from '../typescript/findNode'
import { isTypedTestTestInterface } from '../typescript/isTypedTestTestInterface'
import { parseTestMetadata } from './parseTestMetadata'

export async function findMetadataFromProgram(
  sourcePaths: ReadonlyArray<string>,
  program: ts.Program,
): Promise<TestMetadata[]> {
  const { currentDirectory, typeChecker, sourceFiles } = programData(program)
  const absoluteSourcePaths = sourcePaths.map(x => join(currentDirectory, x))
  const typedTestInterface = await findNode(isTypedTestTestInterface(typeChecker), sourceFiles)
  const typedTestSymbol = typeChecker.getTypeAtLocation(typedTestInterface).getSymbol() as ts.Symbol
  const userSourceFiles = sourceFiles.filter(
    ({ fileName }) =>
      isAbsolute(fileName)
        ? absoluteSourcePaths.includes(fileName)
        : absoluteSourcePaths.includes(join(currentDirectory, fileName)),
  )

  return parseTestMetadata(userSourceFiles, typedTestSymbol, typeChecker).map(m => ({
    ...m,
    filePath: isAbsolute(m.filePath) ? m.filePath : join(currentDirectory, m.filePath),
  }))
}

function programData(program: ts.Program) {
  return {
    typeChecker: program.getTypeChecker(),
    currentDirectory: program.getCurrentDirectory(),
    sourceFiles: program.getSourceFiles(),
  }
}
