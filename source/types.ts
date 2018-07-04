export const TYPED_TEST = Symbol.for('@typed/Test')

export interface Test {
  readonly [TYPED_TEST]: TestConfig
  readonly runTest: (spec: TestSpec) => Promise<TestResult>
}

export interface TestConfig {
  readonly name: string
  readonly timeout?: number
  readonly modifier?: 'only' | 'skip'
}

export interface TestSpec {
  readonly timeout: number
}

export type TestResult = PassedTestResult | SkippedTestResult | FailedTestResult | GroupResult

export type PassedTestResult = { readonly type: 'pass'; readonly name: string }
export type SkippedTestResult = { readonly type: 'skip'; readonly name: string }
export type FailedTestResult = {
  readonly type: 'fail'
  readonly error: Error
  readonly name: string
}
export type GroupResult = {
  readonly type: 'group'
  readonly name: string
  readonly results: TestResult[]
}

export interface TestMetadata extends NodeMetadata {
  readonly exportNames: string[]
  readonly filePath: string
  readonly additionalTests: NodeMetadata[]
}

export interface NodeMetadata {
  readonly line: number
  readonly lines: number
  readonly position: [number, number]
  readonly text: string
}

export type TestsWithMetadata = TestMetadata & { readonly tests: Test[] }
export type TestsWithResults = TestsWithMetadata & { readonly results: TestResult[] }
export type JsonResults = { [K in Exclude<keyof TestsWithResults, 'tests'>]: TestsWithResults[K] }
