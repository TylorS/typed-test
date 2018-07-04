import { errorToString } from 'assertion-error-diff'
import { blue, bold, green, red, underline } from 'typed-colors'
import { cross, tick } from 'typed-figures'
import { collectByKey } from '../common/collectByKey'
import { FailedTestResult, GroupResult, JsonResults, TestResult } from '../types'

export function resultsToString(results: JsonResults[]): string {
  const resultsByFilePath = collectByKey(x => x.filePath, results)
  const filePaths = Object.keys(resultsByFilePath).sort()
  let str = `\n`

  const lastIndex = filePaths.length - 1
  filePaths.forEach((filePath, index) => {
    const jsonResults = resultsByFilePath[filePath]

    if (index !== 0) {
      str += `\n`
    }

    str += underline(filePath)

    for (const jsonResult of jsonResults) {
      str +=
        `\n` +
        moveIn(
          jsonResult.results
            .map(result => resultToString(filePath + `:${jsonResult.line}`, result))
            .join(`\n`),
        )
    }

    if (index !== lastIndex) {
      str += `\n`
    }
  })

  return str.replace(/\n(\s)+\n(\s)+\n/g, '\n\n')
}

export function resultToString(filePath: string, result: TestResult, nested = false): string {
  if (result.type === 'pass') {
    return formatPassingResult(result, nested)
  }

  if (result.type === 'fail') {
    return formatFailingResult(filePath, result, nested)
  }

  if (result.type === 'skip') {
    return formatSkippedResult(result, nested)
  }

  return formatGroupResult(filePath, result)
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

function formatFailingResult(
  filePath: string,
  { name, error }: FailedTestResult,
  nested: boolean,
): string {
  const resultName = `${red(cross)} ${testName(name)} - ${filePath}`
  const resultError = errorToString(error)

  return newLineWhenNotNested(resultName + moveIn(`\n` + resultError), nested)
}

function formatSkippedResult({ name }: TestResult, nested: boolean): string {
  return newLineWhenNotNested(`${blue('(Skipped)')} ${testName(name)}`, nested)
}

function formatGroupResult(filePath: string, result: GroupResult): string {
  const { results, name } = result

  return (
    `\n${underline(bold(testName(name)))}\n  ` +
    moveIn(
      results
        .map((x, i) => {
          const r = resultToString(filePath, x, true)

          if (i > 0 && x.type !== 'group' && results[i - 1].type === 'group') {
            return `\n${r}`
          }

          return x.type === 'fail' ? `${r}\n` : r
        })
        .join(`\n`),
    )
  )
}

function newLineWhenNotNested(s: string, nested: boolean) {
  return nested ? s : `\n${s}`
}

function moveIn(str: string): string {
  return str.replace(/\n/g, `\n  `)
}
