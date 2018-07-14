import { describe, given, it } from '.'

export const suite = describe('Typed Test + VSCode extension', [
  given('Just your TypeScript Configuration (tsconfig.json)', [
    it('Finds and builds metadata on all your tests', ({ ok }) => ok(true)),

    it('Defaults to incrementally running your tests with node', ({ notOk }) => notOk(false)),

    it('supports browsers with just --mode=browser', ({ ok }) => ok(true)),
  ]),
])
