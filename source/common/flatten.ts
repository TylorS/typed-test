export function flatten<A>(list: A[][]): A[] {
  return list.reduce((xs, x) => xs.concat(x), [])
}

export const chain = <A, B>(fn: (value: A, index: number) => B[], list: A[]): B[] =>
  flatten(list.map(fn))
