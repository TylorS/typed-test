import { chain } from '../common/flatten'
import { getModifier } from '../tests/getModifier'
import { updateModifier } from '../tests/updateModifier'
import { TestsWithMetadata, TYPED_TEST } from '../types'
import { BrowserApi } from './types'

export async function run({
  TIMEOUT,
  retrieveMetadata,
  runTests,
  reportResults,
  console,
}: BrowserApi) {
  const metadata = findTestsToRun(await retrieveMetadata())

  await console.log('Running tests...')
  const start = performance.now()
  const results = await runTests(TIMEOUT, metadata)
  const end = performance.now()
  const timeToRun = end - start
  await console.log(`Tests run in: ${timeToRun}`)

  await reportResults(results)
}

function findTestsToRun(metadata: TestsWithMetadata[]): TestsWithMetadata[] {
  const tests = chain(x => x.tests, metadata)
  const hasOnly = tests.some(x => x[TYPED_TEST].modifier === 'only')
  const allSkip = tests.every(x => x[TYPED_TEST].modifier === 'skip')
  const modifier = hasOnly ? 'only' : allSkip ? 'skip' : void 0

  return metadata.map(m => {
    const testsToRun =
      modifier === 'only'
        ? m.tests.map(
            x => (getModifier(x) === 'only' ? x : { ...x, test: updateModifier('skip', x) }),
          )
        : m.tests

    return {
      ...m,
      tests: testsToRun,
    }
  })
}
