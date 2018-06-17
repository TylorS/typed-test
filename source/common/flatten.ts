export function flatten<A>(list: A[][]): A[] {
  return list.reduce((xs, x) => xs.concat(x), [])
}
