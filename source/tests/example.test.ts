import { it } from './it'

export const failing = it('failing', ({ ok }) => ok(true))
export const passing = it('passing', ({ ok }) => ok(true))
export const withPromise = it('with promise', ({ ok }) => Promise.resolve(true).then(ok))
export const withPromiseFailing = it('with promise failing', ({ ok }) =>
  Promise.resolve(false).then(ok))
