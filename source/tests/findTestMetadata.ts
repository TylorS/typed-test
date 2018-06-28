import { isAbsolute, join } from 'path'
import { register } from 'ts-node'
import { CompilerOptions, createProgram, Program, Symbol } from 'typescript'
import { resolveFileGlobs } from '../cli'
import { TestMetadata } from '../types'
import {
  findNode,
  findTsConfig,
  isTypedTestTestInterface,
  ProcessResults,
  registerTsPaths,
  typecheckInAnotherProcess,
} from '../typescript'
import { parseTestMetadata } from './parseTestMetadata'

const EXCLUDE = ['./node_modules/**']

export async function findTestMetadata(
  mode: 'node' | 'browser',
  typeCheck: boolean,
): Promise<TestMetadata[]> {
  const { compilerOptions, files = [], include = [], exclude = EXCLUDE } = findTsConfig()

  if (mode === 'node') {
    registerTsPaths(compilerOptions)
    register({ transpileOnly: true })
  }

  const sourcePaths = await resolveFileGlobs([...files, ...include, ...exclude.map(x => `!${x}`)])
  const metadata = await findMetadata(sourcePaths, compilerOptions)

  if (typeCheck) {
    typecheckInAnotherProcess(sourcePaths).then(({ exitCode, stderr, stdout }: ProcessResults) => {
      if (stdout.trim()) {
        console.log(stdout)
      }

      if (exitCode > 1) {
        return console.error(stderr)
      }

      console.log('Type-checking complete.')
    })
  }

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
