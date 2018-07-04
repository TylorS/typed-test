import { Logger, TestsWithMetadata, TestsWithResults } from '../types'

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

  readonly logger: Logger
}
