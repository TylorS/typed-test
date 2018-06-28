import { join, relative } from 'path'
import { collectByKey } from '../common/collectByKey'
import { chain } from '../common/flatten'
import { TestMetadata } from '../types'

export function generateTestBundle(
  fileDirectory: string,
  port: number,
  timeout: number,
  metadata: TestMetadata[],
): string {
  const stats: Stats = { numberOfTests: 0, testToTestNumber: {} }
  const metadataByFilePath = collectByKey(x => x.filePath, metadata)
  const filePaths = Object.keys(metadataByFilePath)
  const relativePath = relative(fileDirectory, __dirname)
  const importStatements = filePaths.map(filePath =>
    buildImportStatement(fileDirectory, stats, filePath, metadataByFilePath[filePath]),
  )

  return [
    importStatements.join(`\n`),
    createTestsWithMetadata(stats.testToTestNumber, metadata),
    createApi(relativePath, port, timeout),
    createTestRun(relativePath),
    `\n`,
  ].join(`\n`)
}

function createTestRun(relativePath: string): string {
  return [
    `import { run } from '${join(relativePath, 'runTestsAndReport')}'`,
    `\n`,
    `run(TypedTest)`,
  ].join(`\n`)
}

function createApi(relativePath: string, port: number, timeout: number): string {
  return [
    `const retrieveMetadata = () => Promise.resolve(TYPED_TEST_METADATA)`,
    `import { reportResults, console } from '${join(relativePath, 'api')}'`,
    `import { runTests } from '${join(relativePath, '../common/runTests')}'`,
    `const TypedTest = Object.freeze({
      retrieveMetadata,
      reportResults,
      runTests,
      console,
      TIMEOUT: ${timeout},
      PORT: ${port}
    })`,
    `export = TypedTest`,
  ].join(`\n`)
}

function createTestsWithMetadata(
  testToTestNumber: Record<string, number>,
  metadata: TestMetadata[],
): string {
  const tests = metadata.map(m => {
    const testNames = findTestNames(m).map(x => `test${testToTestNumber[x]}`)

    return `\n  Object.assign({}, ${JSON.stringify(m)}, { tests: [${testNames.join(', ')}] })`
  })

  return `const TYPED_TEST_METADATA = [` + tests.join(',') + `\n]\n\n`
}

function findTestNames({ exportNames, filePath }: TestMetadata): string[] {
  return exportNames.map(x => `${filePath}/${x}`)
}

type Stats = { numberOfTests: number; testToTestNumber: Record<string, number> }

function buildImportStatement(
  fileDirectory: string,
  stats: Stats,
  filePath: string,
  metadata: TestMetadata[],
): string {
  const exportNames = chain(x => x.exportNames, metadata)
  const importSpecifiers: string[] = []

  for (const exportName of exportNames) {
    const testName = `${filePath}/${exportName}`
    const testNum = stats.numberOfTests
    const specifier = ` ${exportName} as test${testNum}`
    stats.testToTestNumber[testName] = testNum

    stats.numberOfTests++

    importSpecifiers.push(specifier)
  }

  const moduleSpecificer = relative(fileDirectory, filePath.replace(/\.ts(x)?$/, ''))

  return `import {${importSpecifiers.join(',')} } from '${moduleSpecificer}'`
}
