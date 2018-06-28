// tslint:disable-next-line:no-var-requires
const { find } = require('openport')

export function findOpenPort(): Promise<number> {
  return new Promise((resolve, reject) =>
    find((err: Error | null, port: number) => (err ? reject(err) : resolve(port))),
  )
}
