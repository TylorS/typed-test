import { Test, TYPED_TEST } from '../types'

export function updateModifier(modifier: 'only' | 'skip', test: Test): Test {
  return { ...test, [TYPED_TEST]: { ...test[TYPED_TEST], modifier } }
}
