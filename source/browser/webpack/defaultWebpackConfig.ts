import { existsSync } from 'fs'
import { basename, dirname } from 'path'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin/lib'
import { findConfigFile } from 'typescript'
import { Configuration } from 'webpack'

export type WebpackOptions = {
  cwd: string
  input: string
  output: string
}

export const defaultWebpackConfig = (cwd: string, input: string, output: string): Configuration => {
  const configFile = findConfigFile(cwd, (fileName: string) => existsSync(fileName))

  if (!configFile) {
    throw new Error('Unable to find TypeScript configuration')
  }

  return {
    mode: 'development',
    entry: input,
    devtool: 'inline-source-map',
    output: {
      path: dirname(output),
      filename: basename(output),
      library: 'TypedTest',
      libraryTarget: 'umd',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile,
          },
        },
      ],
    },
    resolve: {
      mainFields: ['module', 'jsnext:main', 'browser', 'main'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      plugins: [new TsconfigPathsPlugin({ configFile })],
    },
  }
}
