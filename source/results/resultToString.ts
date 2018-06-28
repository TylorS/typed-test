import { blue, bold, green, red } from 'typed-colors'
import { cross, tick } from 'typed-figures'
import { GroupResult, TestResult } from '../types'

export function resultsToString(results: TestResult[]): string {
  return results.map(x => resultToString(x)).join(`\n`)
}

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

function testName(name: string): string {
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

function formatPassingResult({ name }: TestResult, nested: boolean): string {
  return newLineWhenNotNested(`${green(tick)} ${testName(name)}`, nested)
}

function formatFailingResult({ name }: TestResult, nested: boolean): string {
  return newLineWhenNotNested(`${red(cross)} ${testName(name)}`, nested)
}

function formatSkippedResult({ name }: TestResult, nested: boolean): string {
  return newLineWhenNotNested(`${blue('(Skipped)')} ${testName(name)}`, nested)
}

function formatGroupResult(result: GroupResult): string {
  const { results, name } = result

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
