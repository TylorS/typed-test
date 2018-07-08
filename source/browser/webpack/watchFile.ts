import * as Webpack from 'webpack'
import { defaultWebpackConfig } from './defaultWebpackConfig'

export function watchFile(
  cwd: string,
  input: string,
  output: string,
  cb: (stats: Webpack.Stats) => void,
  error: (error: Error) => void,
) {
  const compiler = Webpack(defaultWebpackConfig(cwd, input, output))

  compiler.watch({ aggregateTimeout: 600 }, (err, stats) => {
    if (err) {
      return error(err)
    }

    cb(stats)
  })
}
