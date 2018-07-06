import { it } from './it'

export const failing = it('failing', ({ ok }) => ok(false))
export const passing = it('passing', ({ ok }) => ok(false))

export const withPromise = it('with promise', ({ ok }) => Promise.resolve(true).then(ok))
