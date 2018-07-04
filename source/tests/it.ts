import { Assertions, createAssertionsEnvironment } from '@typed/assertions'
import { Test, TYPED_TEST } from '../types'
import { createTest } from './createTest'
import { updateModifier } from './updateModifier'

export { Assertions }

export function it(
  does: string,
  what: (assertions: Assertions, done: (error?: Error) => void) => any,
): Test {
  const test = createTest(`it ${does}`, ({ timeout, skip }) => {
    return new Promise(resolve => {
      if (skip) {
        return resolve({ type: 'skip', name: does })
      }

      const { stats, assertions } = createAssertionsEnvironment()
      const id = setTimeout(resolve, timeout, {
        type: 'fail',
        test,
        error: new Error(`Test timed out after ${timeout}ms`),
      })

      function done(error?: Error): void {
        clearTimeout(id)

        if (error || stats.count < 1) {
          return resolve({
            type: 'fail',
            name: test[TYPED_TEST].name,
            error: error
              ? error instanceof Error
                ? error
                : new Error(String(error))
              : new Error('No Assertions used'),
          })
        }

        resolve({
          type: 'pass',
          name: test[TYPED_TEST].name,
        })
      }

      if (what.length === 0) {
        return done()
      }

      try {
        const returnValue = what(assertions, done)
        const isPromise = returnValue && typeof (returnValue as Promise<any>).then === 'function'

        if (!isPromise && what.length === 1) {
          return done()
        }

        if (isPromise && what.length === 2) {
          return done(new Error('Cannot use done callback and return Promise'))
        }

        if (isPromise) {
          return returnValue.then(() => done(), done)
        }
      } catch (err) {
        done(err)
      }
    })
  })

  return test
}

export namespace it {
  export function only(
    does: string,
    what: (assertions: Assertions, done: (error?: Error) => void) => any,
  ): Test {
    return updateModifier('only', it(does, what))
  }

  export function skip(
    does: string,
    what: (assertions: Assertions, done: (error?: Error) => void) => any,
  ): Test {
    return updateModifier('skip', it(does, what))
  }
}
