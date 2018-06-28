import { cross, tick } from 'typed-figures'
import { GroupResult, TestResult } from '../types'

export function resultsToDom(results: TestResult[]): HTMLElement {
  return withChildren(flexColumn(), results.map(x => resultToDom(x)))
}

export function resultToDom(result: TestResult, nested: boolean = false): HTMLElement {
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

function formatPassingResult({ name }: TestResult, nested: boolean): HTMLElement {
  const element = withChildren(flexContainer(), [greenTick(), testName(name)])

  return marginTopIfNotNested(element, nested)
}

function formatFailingResult({ name }: TestResult, nested: boolean): HTMLElement {
  const element = withChildren(flexContainer(), [redCross(), testName(name)])

  return marginTopIfNotNested(element, nested)
}

function formatSkippedResult({ name }: TestResult, nested: boolean): HTMLElement {
  const element = withChildren(flexContainer(), [blueText('(Skipped) '), testName(name)])

  return marginTopIfNotNested(element, nested)
}

function formatGroupResult(result: GroupResult): HTMLElement {
  const { results, name } = result
  const container = flexColumn()

  return withChildren(withStyle(container, { marginTop: '1rem' }), [
    testName(name, true),
    withChildren(
      withStyle(flexColumn(), { paddingLeft: '1rem' }),
      results.map((x, i) => {
        const r = resultToDom(x, true)

        if (i > 0 && x.type !== 'group' && results[i - 1].type === 'group') {
          return withStyle(r, { marginTop: '1rem' })
        }

        return r
      }),
    ),
  ])
}

function testName(name: string, bold: boolean = false): HTMLElement {
  const itRegex = /^it\s/
  const givenRegex = /^given\s/

  if (itRegex.test(name)) {
    return withChildren(flexContainer(), [blueText('it '), text(name.replace(itRegex, '').trim())])
  }

  if (givenRegex.test(name)) {
    const testNameParsed = name.replace(givenRegex, '').trim()

    return withChildren(flexContainer(), [
      blueText('given ', bold),
      bold ? boldText(testNameParsed) : text(testNameParsed),
    ])
  }

  return text(name)
}

function withChildren<A extends Element>(element: A, children: Element[]): A {
  children.forEach(child => element.appendChild(child))

  return element
}

function boldText(txt: string): HTMLParagraphElement {
  return withStyle(text(txt), { fontWeight: '700' })
}

function blueText(txt: string, bold: boolean = false): HTMLParagraphElement {
  return withStyle(bold ? boldText(txt) : text(txt), { color: 'blue' })
}

function text(s: string): HTMLParagraphElement {
  const element = document.createElement('p')
  element.textContent = s

  return withStyle(element, { margin: '0 0.25rem' })
}

function redCross(): HTMLParagraphElement {
  return withStyle(text(cross), { color: 'red' })
}

function greenTick(): HTMLParagraphElement {
  return withStyle(text(tick), { color: 'green' })
}

function flexColumn(): HTMLDivElement {
  return withStyle(document.createElement('div'), {
    display: 'inline-flex',
    flexDirection: 'column',
  })
}

function flexContainer(): HTMLDivElement {
  return withStyle(document.createElement('div'), {
    display: 'inline-flex',
    flexDirection: 'row',
  })
}

function marginTopIfNotNested<A extends HTMLElement>(el: A, nested: boolean): A {
  return nested ? el : withStyle(el, { marginTop: '1rem' } as any)
}

function withStyle<A extends HTMLElement>(
  el: A,
  styles: { [K in keyof A['style']]?: A['style'][K] },
): A {
  const keys = Object.keys(styles) as Array<keyof A['style'] & keyof CSSStyleDeclaration>
  keys.forEach(key => (el.style[key] = styles[key]))

  return el
}
