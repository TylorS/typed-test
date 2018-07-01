// tslint:disable-next-line:no-var-requires
const { getPortPromise } = require('portfinder')

export function findOpenPort(): Promise<number> {
  return getPortPromise().then(parseFloat)
}
