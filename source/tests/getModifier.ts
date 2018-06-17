import { Test, TYPED_TEST } from '../types'

export function getModifier(test: Test): 'skip' | 'only' | undefined {
  return test[TYPED_TEST].modifier
}
