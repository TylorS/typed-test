import { isAbsolute, join } from 'path'
import { collectByKey } from '../common/collectByKey'
import { flatten } from '../common/flatten'
import { getModifier } from '../tests/getModifier'
import { updateModifier } from '../tests/updateModifier'
import { TestMetadata, TestsWithMetadata, TYPED_TEST } from '../types'
import { Test } from '../types'

export function collectTests(cwd: string, testMetadata: TestMetadata[]): TestsWithMetadata[] {
  const metadataByFilePath: Record<string, TestMetadata[]> = collectByKey(
    x => joinIfNotAbsolute(cwd, x.filePath),
    testMetadata,
  )
  const filePaths = Object.keys(metadataByFilePath)

  return flatten(
    filePaths.map(filePath => testsWithMetadata(filePath, metadataByFilePath[filePath])),
  )
}

function joinIfNotAbsolute(cwd: string, filePath: string) {
  return isAbsolute(filePath) ? filePath : join(cwd, filePath)
}

// Must collect whole file at once to properly handle only/skip modifiers
function testsWithMetadata(filePath: string, metadataList: TestMetadata[]): TestsWithMetadata[] {
  const allExportNames = flatten(metadataList.map(x => x.exportNames))
  const testsWithName = findTestsToRun(filePath, allExportNames)

  return metadataList.map(metadata => {
    const { exportNames } = metadata
    const tests = exportNames.map(
      n => (testsWithName.find(x => x.name === n) as { test: Test }).test,
    )

    return { ...metadata, tests }
  })
}

function findTestsToRun(
  filePath: string,
  exportNames: string[],
): Array<{ name: string; test: Test }> {
  const requiredModule = require(filePath)
  const tests: Array<{ name: string; test: Test }> = []

  for (const name of exportNames) {
    if (requiredModule[name]) {
      tests.push({ name, test: requiredModule[name] })
    }
  }

  const hasOnly = tests.some(x => x.test[TYPED_TEST].modifier === 'only')
  const allSkip = tests.every(x => x.test[TYPED_TEST].modifier === 'skip')
  const modifier = hasOnly ? 'only' : allSkip ? 'skip' : void 0
  const testsToRun: Array<{ name: string; test: Test }> =
    modifier === 'only'
      ? tests.map(
          x =>
            getModifier(x.test) === 'only' ? x : { ...x, test: updateModifier('skip', x.test) },
        )
      : tests

  return testsToRun
}
