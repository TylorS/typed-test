import * as Webpack from 'webpack'
import { Logger } from '../../types'
import { defaultWebpackConfig } from './defaultWebpackConfig'
import { logErrors } from './logErrors'

export function bundleFileOrExit(
  cwd: string,
  input: string,
  output: string,
  logger: Logger,
  extendConfiguration: (config: Webpack.Configuration) => Webpack.Configuration,
): Promise<void> {
  const defaultConfig = defaultWebpackConfig(cwd, input, output)
  const extendedConfiguration = { ...extendConfiguration(defaultConfig) }
  extendedConfiguration.entry = defaultConfig.entry
  extendedConfiguration.output = defaultConfig.output

  const compiler = Webpack(extendedConfiguration)
  const logError = logErrors(logger)

  return new Promise<void>((resolve, reject) =>
    compiler.run((err, stats) => (logError(err, stats, reject), resolve())),
  )
}
