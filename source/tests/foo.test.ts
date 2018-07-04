import { describe } from './describe'
import { it } from './it'

export const suite = describe('Things', [
  it('failing', ({ ok }) => ok(true)),
  it('passing', ({ ok }) => ok(true)),
  it('with promise', ({ ok }) => Promise.resolve(true).then(ok)),
  it('with promise', ({ ok }) => Promise.resolve(true).then(ok)),

  describe('Inner things', [
    describe('foo', [
      it('with promise', ({ ok }) => Promise.resolve(true).then(ok)),
      it('with promise', ({ ok }) => Promise.resolve(true).then(ok)),
    ]),

    describe('More Inner things', [
      it('with promise', ({ ok }) => Promise.resolve(true).then(ok)),
      it('with promise', ({ ok }) => Promise.resolve(true).then(ok)),

      describe('Deep Inner things', [
        it('with promise', ({ ok }) => Promise.resolve(false).then(ok)),
      ]),
    ]),
  ]),
])
