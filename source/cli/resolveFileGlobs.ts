import glob from 'glob'

export function resolveFileGlobs(globs: string[]): Promise<string[]> {
  return Promise.all(globs.map(resolveFileGlob)).then(xss =>
    xss.reduce((xs, x) => xs.concat(x), []),
  )
}

function resolveFileGlob(globPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(globPath, {}, (err: Error | null, matches: string[]) => {
      if (err) {
        return reject(err)
      }

      resolve(matches)
    })
  })
}
