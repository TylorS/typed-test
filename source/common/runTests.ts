import { Test, TestResult, TestsWithMetadata, TestsWithResults, TYPED_TEST } from '../types'

export function runTests(
  defaultTimeout: number,
  metadata: TestsWithMetadata[],
): Promise<TestsWithResults[]> {
  return Promise.all(
    metadata.map(m =>
      Promise.all(m.tests.map(runTest(defaultTimeout))).then(results => ({ ...m, results })),
    ),
  )
}

function runTest(defaultTimeout: number) {
  return (test: Test): Promise<TestResult> => {
    const { modifier, timeout = defaultTimeout, name } = test[TYPED_TEST]

    if (modifier === 'skip') {
      return Promise.resolve({ type: 'skip', name } as TestResult)
    }

    return test.runTest({ timeout }).then(x => ({ ...x, name }))
  }
}
