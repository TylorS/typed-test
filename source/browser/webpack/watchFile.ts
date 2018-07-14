import * as Webpack from 'webpack'
import { defaultWebpackConfig } from './defaultWebpackConfig'

export function watchFile(
  cwd: string,
  input: string,
  output: string,
  extendConfiguration: (config: Webpack.Configuration) => Webpack.Configuration,
  cb: (stats: Webpack.Stats) => void,
  error: (error: Error) => void,
) {
  const compiler = Webpack(extendConfiguration(defaultWebpackConfig(cwd, input, output)))

  compiler.watch({ aggregateTimeout: 600 }, (err, stats) => {
    if (err) {
      return error(err)
    }

    cb(stats)
  })
}
