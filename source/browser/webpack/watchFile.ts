import Webpack from 'webpack'
import { defaultWebpackConfig } from './defaultWebpackConfig'

export function watchFile(
  cwd: string,
  input: string,
  output: string,
  extendConfiguration: (config: Webpack.Configuration) => Webpack.Configuration,
  cb: (stats: Webpack.Stats) => void,
  error: (error: Error) => void,
) {
  const defaultConfig = defaultWebpackConfig(cwd, input, output)
  const extendedConfiguration = { ...extendConfiguration(defaultConfig) }
  extendedConfiguration.entry = defaultConfig.entry
  extendedConfiguration.output = defaultConfig.output

  const compiler = Webpack(extendedConfiguration)

  compiler.watch({ aggregateTimeout: 600 }, (err, stats) => {
    if (err) {
      return error(err)
    }

    cb(stats)
  })
}
