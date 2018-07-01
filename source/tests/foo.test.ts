import { describe } from './describe'
import { it } from './it'

const failing = it('failing', ({ ok }) => ok(false))
const passing = it('passing', ({ ok }) => ok(true))
const withPromise = it('with promise', ({ ok }) => Promise.resolve(true).then(ok))
const withPromiseFailing = it('with promise', ({ ok }) => Promise.resolve(false).then(ok))

export const suite = describe('Things', [failing, withPromiseFailing, passing, withPromise])
