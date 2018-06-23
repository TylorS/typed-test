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

  const test = {
    modifier,
    ...createTest(`${what}`, spec => {
      return new Promise(async resolve => {
        Promise.all(
          testsToRun.map(
            t =>
              getModifier(t) !== 'skip'
                ? t.runTest(spec).then(r => ({ ...r, name: t[TYPED_TEST].name }))
                : Promise.resolve({ type: 'skip', name: t[TYPED_TEST].name } as TestResult),
          ),
        ).then(results => resolve({ type: 'group', results, name: test[TYPED_TEST].name }))
      })
    }),
  }

  return test
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
