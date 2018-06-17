import { collectTests, runTests } from './node'
import { resultToString } from './results'
import { findTestMetadata } from './tests'

async function main() {
  const KEY = 'Find and run tests'
  console.time(KEY)
  const metadata = await runTests(2000, collectTests(await findTestMetadata()))
  console.timeEnd(KEY)

  const output = metadata.map(x => x.results.map(y => resultToString(y))).join('\n')

  console.log(output)
}

main()
