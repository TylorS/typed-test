import { describe } from './describe'
import { given } from './given'
import { it } from './it'
import { skip } from './skip'

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

export default passing