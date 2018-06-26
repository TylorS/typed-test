import { BrowserApi } from './types'

export async function run(api: BrowserApi) {
  const metadata = api.retrieveMetadata()
  const results = await api.runTests(2000, metadata)

  console.log(results)

  await api.reportResults(results)
}
