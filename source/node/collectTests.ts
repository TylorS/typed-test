import { isAbsolute, join } from 'path'
import { collectByKey } from '../common/collectByKey'
import { flatten } from '../common/flatten'
import { TestMetadata, TestsWithMetadata } from '../types'

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
  const testModule = require(filePath)

  return metadataList.map(metadata => ({
    ...metadata,
    tests: metadata.exportNames.map(x => testModule[x]),
  }))
}
