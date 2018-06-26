import { TestsWithMetadata, TestsWithResults } from '../types'

export interface BrowserApi {
  readonly retrieveMetadata: () => TestsWithMetadata[]
  readonly runTests: (
    defaultTimeout: number,
    metadata: TestsWithMetadata[],
  ) => Promise<TestsWithResults[]>
  readonly reportResults: (results: TestsWithResults[]) => Promise<void>
}

export type JsonResults = {
  [K in keyof TestsWithResults]: K extends 'tests' ? never : TestsWithResults[K]
}
