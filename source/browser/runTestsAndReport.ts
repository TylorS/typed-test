import { BrowserApi } from './types'

export async function run({
  TIMEOUT,
  retrieveMetadata,
  runTests,
  reportResults,
  console,
  cwd,
}: BrowserApi) {
  const metadata = await retrieveMetadata()

  await console.log('Running tests...')
  const start = performance.now()
  const results = await runTests(TIMEOUT, metadata)
  const end = performance.now()
  const timeToRun = Math.round((end - start) * 100) / 100
  await console.log(`Tests run in: ${timeToRun}ms`)

  await reportResults(results, cwd)
}
