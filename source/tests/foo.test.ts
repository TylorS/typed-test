import { describe } from './describe'
import { it } from './it'

export const suite = describe('Things', [
  it('failing', ({ ok }) => ok(false)),
  it('passing', ({ ok }) => ok(true)),
  it('with promise', ({ ok }) => Promise.resolve(false).then(ok)),
  it('with promise', ({ ok }) => Promise.resolve(true).then(ok)),
])
