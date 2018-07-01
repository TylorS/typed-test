import { TestsWithMetadata, TestsWithResults } from '../types'

export interface BrowserApi {
  readonly cwd: string
  readonly TIMEOUT: number
  readonly PORT: number
  readonly retrieveMetadata: () => Promise<TestsWithMetadata[]>
  readonly runTests: (
    defaultTimeout: number,
    metadata: TestsWithMetadata[],
  ) => Promise<TestsWithResults[]>
  readonly reportResults: (results: TestsWithResults[], cwd: string) => Promise<void>

  readonly console: {
    readonly log: (msg: string) => Promise<void>
    readonly error: (msg: string) => Promise<void>
    readonly clear: () => Promise<void>
  }
}

export type JsonResults = { [K in Exclude<keyof TestsWithResults, 'tests'>]: TestsWithResults[K] }
