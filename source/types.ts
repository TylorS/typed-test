export type Arity0<A = void> = () => A
export type Arity1<A, B = void> = (value: A) => B

export const TYPED_TEST = Symbol('@typed/Test')

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

export type TestResult =
  | { readonly type: 'pass'; readonly test: Test }
  | { readonly type: 'fail'; readonly error: Error; readonly test: Test }
  | { readonly type: 'skip'; readonly test: Test }
  | GroupResult

export type GroupResult = {
  readonly type: 'group'
  readonly test: Test
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
