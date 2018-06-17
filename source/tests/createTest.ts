import { Test, TestResult, TestSpec, TYPED_TEST } from '../types'

export function createTest(name: string, runTest: (spec: TestSpec) => Promise<TestResult>): Test {
  return {
    [TYPED_TEST]: { name },
    runTest,
  }
}
