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
  | { readonly type: 'pass'; readonly name: string }
  | { readonly type: 'fail'; readonly error: Error; readonly name: string }
  | { readonly type: 'skip'; readonly name: string }
  | GroupResult

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
