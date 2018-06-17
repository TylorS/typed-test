import { Test } from '../types'
import { describe } from './describe'

export function given(that: string, tests: Test[]): Test {
  return describe(`given ${that}`, tests)
}
