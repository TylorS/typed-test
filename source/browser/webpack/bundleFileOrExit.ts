import { defaultWebpackConfig } from './defaultWebpackConfig'
import { logErrors } from './logErrors'
import Webpack from 'webpack'

export function bundleFileOrExit(cwd: string, input: string, output: string): Promise<void> {
  const compiler = Webpack(defaultWebpackConfig(cwd, input, output))

  return new Promise<void>(resolve =>
    compiler.run((err, stats) => (logErrors(err, stats), resolve())),
  )
}
