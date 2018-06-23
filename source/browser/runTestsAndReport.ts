import { BrowserApi } from './types'

export async function run(api: BrowserApi) {
  const metadata = api.retrieveMetadata()
  const results = await api.runTests(2000, metadata)

  await api.reportResults(results)
}

