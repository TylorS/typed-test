import { describe } from '@typed/tests/describe'
import { given } from '@typed/tests/given'
import { it } from '@typed/tests/it'
import { skip } from '@typed/tests/skip'

export const failing = it('failing', ({ ok }) => ok(false))
export const passing = it('passing', ({ ok }) => ok(true))
export const withPromise = it('with promise', ({ ok }) => Promise.resolve(true).then(ok))
export const withPromiseFailing = it('with promise', ({ ok }) => Promise.resolve(false).then(ok))

export const suite = describe('Things', [failing, passing])

export const suiteOfSuites = describe.only('More Things', [
  suite,
  skip(passing),
  suite,
  given('foo', [failing]),
  suite,
  suite,
])
