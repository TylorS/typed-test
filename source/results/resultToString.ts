import { blue, bold, green, red } from 'typed-colors'
import { cross, tick } from 'typed-figures'
import { GroupResult, Test, TestResult, TYPED_TEST } from '../types'

export function resultToString(result: TestResult, nested = false): string {
  if (result.type === 'pass') {
    return formatPassingResult(result, nested)
  }

  if (result.type === 'fail') {
    return formatFailingResult(result, nested)
  }

  if (result.type === 'skip') {
    return formatSkippedResult(result, nested)
  }

  return formatGroupResult(result)
}

function testName(test: Test): string {
  const { name } = test[TYPED_TEST]
  const itRegex = /^it\s/
  const givenRegex = /^given\s/

  if (itRegex.test(name)) {
    return name.replace(itRegex, `${blue('it ')}`)
  }

  if (givenRegex.test(name)) {
    return name.replace(givenRegex, `${blue('given ')}`)
  }

  return name
}

function formatPassingResult({ test }: TestResult, nested: boolean): string {
  return newLineWhenNotNested(`${green(tick)} ${testName(test)}`, nested)
}

function formatFailingResult({ test }: TestResult, nested: boolean): string {
  return newLineWhenNotNested(`${red(cross)} ${testName(test)}`, nested)
}

function formatSkippedResult({ test }: TestResult, nested: boolean): string {
  return newLineWhenNotNested(`${blue('(Skipped)')} ${testName(test)}`, nested)
}

function formatGroupResult(result: GroupResult): string {
  const name = testName(result.test)
  const { results } = result

  return (
    `\n${bold(name)}\n  ` +
    results
      .map((x, i) => {
        const r = resultToString(x, true)

        if (i > 0 && x.type !== 'group' && results[i - 1].type === 'group') {
          return `\n${r}`
        }

        return r
      })
      .join(`\n`)
      .replace(/\n/g, `\n  `)
  )
}

function newLineWhenNotNested(s: string, nested: boolean) {
  return nested ? s : `\n${s}`
}
