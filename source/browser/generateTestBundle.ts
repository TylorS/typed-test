import { collectByKey } from '../common/collectByKey'
import { TestMetadata } from '../types'
import { flatten } from '../common/flatten'
import { relative, join } from 'path'

export function generateTestBundle(fileDirectory: string, metadata: TestMetadata[]): string {
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
    createApi(relativePath),
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

function createApi(relativePath: string): string {
  return [
    `const retrieveMetadata = () => TYPED_TEST_METADATA`,
    `import { reportResults } from '${join(relativePath, 'reportResults')}'`,
    `import { runTests } from '${join(relativePath, '../common/runTests')}'`,
    `const TypedTest = Object.freeze({ retrieveMetadata, reportResults, runTests })`,
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

function findTestNames({ exportNames, filePath }: TestMetadata): Array<string> {
  return exportNames.map(x => `${filePath}/${x}`)
}

type Stats = { numberOfTests: number; testToTestNumber: Record<string, number> }

function buildImportStatement(
  fileDirectory: string,
  stats: Stats,
  filePath: string,
  metadata: TestMetadata[],
): string {
  const exportNames = flatten(metadata.map(x => x.exportNames))
  let importSpecifiers: Array<string> = []

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
