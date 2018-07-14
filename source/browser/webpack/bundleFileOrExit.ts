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
  const compiler = Webpack(extendConfiguration(defaultWebpackConfig(cwd, input, output)))
  const logError = logErrors(logger)

  return new Promise<void>((resolve, reject) =>
    compiler.run((err, stats) => (logError(err, stats, reject), resolve())),
  )
}
