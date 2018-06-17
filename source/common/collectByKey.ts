import { Arity1 } from '../types'

export function collectByKey<A, K extends PropertyKey = PropertyKey>(
  f: Arity1<A, K>,
  list: A[],
): Record<K, A[]> {
  const record = {} as Record<K, A[]>

  for (const item of list) {
    const key = f(item)

    if (!record[key]) {
      record[key] = []
    }

    record[key].push(item)
  }

  return record
}
