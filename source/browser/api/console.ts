const headers = { 'Content-Type': 'application/json' }

export function log(msg: string): Promise<void> {
  console.log(msg)

  return fetch(`/log`, { method: 'POST', headers, body: JSON.stringify({ msg }) }).then(
    () => void 0,
  )
}

export function error(msg: string): Promise<void> {
  console.error(msg)

  return fetch(`/error`, { method: 'POST', headers, body: JSON.stringify({ msg }) }).then(
    () => void 0,
  )
}

export function clear(): Promise<void> {
  console.clear()

  return fetch(`/clear`).then(() => void 0)
}
