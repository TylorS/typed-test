import { it } from '../tests/it'
import { Test } from '../types'

export const failing: Test = it('failing', ({ ok }) => ok(true))
export const passing = it('passing', ({ ok }) => ok(true))
export const withPromise = it('with promise', ({ ok }) => Promise.resolve(true).then(ok))
export const withPromiseFailing = it('with promise', ({ ok }) => Promise.resolve(false).then(ok))
