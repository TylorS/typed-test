import { Test, TestResult, TYPED_TEST } from '../types'
import { createTest } from './createTest'
import { getModifier } from './getModifier'
import { updateModifier } from './updateModifier'

export function describe(what: string, tests: Test[]): Test {
  const hasOnly = tests.some(x => x[TYPED_TEST].modifier === 'only')
  const allSkip = tests.every(x => x[TYPED_TEST].modifier === 'skip')
  const modifier = hasOnly ? 'only' : allSkip ? 'skip' : void 0
  const testsToRun: Test[] =
    modifier === 'only'
      ? tests.map(x => (getModifier(x) === 'only' ? x : updateModifier('skip', x)))
      : tests

  const test: Test = createTest(`${what}`, spec => {
    return Promise.all(
      testsToRun.map(t => {
        return t
          .runTest({
            ...spec,
            skip: getModifier(t) === 'skip' || spec.skip,
          })
          .then(r => ({ ...r, name: t[TYPED_TEST].name }))
      }),
    ).then(results => ({ type: 'group', results, name: test[TYPED_TEST].name } as TestResult))
  })

  return modifier ? updateModifier(modifier, test) : test
}

export namespace describe {
  export function only(what: string, tests: Test[]): Test {
    const test = describe(what, tests)

    return { ...test, [TYPED_TEST]: { ...test[TYPED_TEST], modifier: 'only' } }
  }

  export function skip(what: string, tests: Test[]): Test {
    return describe(what, tests.map(x => updateModifier('skip', x)))
  }
}
