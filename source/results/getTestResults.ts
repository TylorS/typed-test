import { flatten } from '../common/flatten'
import { TestResult } from '../types'

export function getTestResults<A extends { results: TestResult[] }>(list: A[]): TestResult[] {
  return flatten(list.map(x => x.results))
}
