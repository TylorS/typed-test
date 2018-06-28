import { BrowserApi } from './types'

export async function run({
  TIMEOUT,
  retrieveMetadata,
  runTests,
  reportResults,
  console,
}: BrowserApi) {
  const metadata = await retrieveMetadata()

  await console.clear()
  await console.log('Running tests')
  const results = await runTests(TIMEOUT, metadata)
  await console.log('Tests Complete')

  await reportResults(results)
}
