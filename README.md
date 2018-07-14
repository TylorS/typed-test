# @typed/test 

Testing that works for you.

Typed Test is a test runner that leverages TypeScript's knowledge of your code,
to provide zero-configuration for the most common scenario - Running your tests 
from within a Node.js environment. Need more? Read on, we've got you covered!

## Get it 

```sh
npm install --save-dev @typed/test
# or 
yarn add --dev @typed/test
```

## A Brief Example 

```typescript
// The entire testing API
import { describe, given, it, Test } from '@typed/test'
// 'describe', 'given', and 'it' all return the interface 'Test'

// Tests must be exported for @typed/test to find them
// 'describe', and 'given' are both used to create suites of tests
export const suite: Test = describe('A suite of tests', [
  given('a condition', [
    // 'it' is used to write tests and make assertions.
    it('is true', ({ ok }) => ok(true))
  ])
])

// The export name does not matter to @typed/test 
// only that @typed/test's 'Test' interface is satisfied.
export const singleTest = it('does a thing', ({ equal }) => {
  equal(3, 4)
})
```

For a more comprehensive example see [this repo](https://github.com/TylorS/typed-test-example).

## Command Line Interface

Without any specified files on the CLI, i.e.
```sh
typed-test source/**/*.test.ts
```
`@typed/test` will first find your `tsconfig.json` and use the `files`, `include` and `exclude` options as to where to find your tests.

### Options 

#### `--mode`: node | browser [default: node]

Allows specifying the environment you would like to run your tests in. 

```sh
typed-test --mode=node
typed-test --mode=browser
```

#### `--timeout`: number [default: 2000]

By default, all tests written using `it` will time out after 2 seconds (2000 milliseconds). This option allows you to customize this behavior.

```sh
typed-test --timeout=5000 # Timeout after 5 seconds
```

#### `--typeCheck`: boolean [default: false]

By default `@typed/test` will not type-check your test files, but 
once enabled type-checking will always be run from a separate process. Incremental type-checking is supported with `--watch`.

```sh
typed-test --typeCheck
```

#### `--watch`: boolean [default: false]

Watch your tests, and incrementally re-run them. Upon first run all of your tests will be run as usual, but afterwards only modified test files will be re-run.

```sh
typed-test --watch
```

### Browser-Mode Options

When using `--mode=browser` these options can be specified to further configure your usage. They are ignore when not using browser mode.

#### `--browser` [default: chrome-headless]

Specify the browser you would like to run your tests in.

NOTE: In order to use a particular browser, it must be installed on the system that you are running your tests.

##### Supported Browsers 
```sh
  typed-test --mode=browser --browser=chrome-headless
  typed-test --mode=browser --browser=chrome
  typed-test --mode=browser --browser=chromium
  typed-test --mode=browser --browser=firefox
  typed-test --mode=browser --browser=opera
  typed-test --mode=browser --browser=safari
  typed-test --mode=browser --browser=ie
```

#### `--keepAlive`: boolean [default: false]

Keep a browser window open after tests have completed running. By default, the browser window (if not headless) will be closed. This 
can be useful for debugging errors from a browser's given DevTools.


## Typed Test Configuration `.typed-test.ts`

For more advanced configurations, and for sharing configuration with our Editor extensions, it is possible to specify a `.typed-test.ts` configuration file which allows more flexibility and options. The configuration file is to be written in TypeScript, to allow type-checking of the configuration itself.

When running from the CLI, any CLI flags will override the corresponding options 
found in your configurations.

```typescript
import { Options } from '@typed/test'

const defaultTypedTestConfig: Options = {
  mode: 'node',
  // if no files are specified defaults 
  // to using files from your tsconfig.json
  files: [], 
  timeout: 2000,
  typeCheck: false,
  watch: false,
  browser: 'chrome-headless', // ignored in 'node' mode
  keepAlive: false, // ignored in 'node' mode
}

export default defaultTypedTestConfig;
```

### Options

#### `files`: Array&lt;string&gt;

Specify which files to look for tests in.

#### `mode`: node | browser [default: node]

Specify the environment you would like to run your tests in. 

#### `timeout`: number [default: 2000]

Customize default timeout time for tests.

#### `typeCheck`: boolean [default: false]

Type-check your tests files.

#### `watch`: boolean [default: false]

Enable watch mode.

### Browser Mode Options

#### `browser`: Browsers [default: chrome-headless]

Specify the browser you would like to run your tests in.

```typescript
type Browsers = 
  'chrome-headless' | 'chrome' | 'chromium' | 'firefox' | 'opera' | 'safari' | 'ie'
```

#### `keepAlive`: boolean [default: false]

Keep a browser window open after tests have completed running.

#### `webpackConfiguration`: (defaultConfig: WebpackConfig) => WebpackConfig

This allows customizing the [default webpack configuration](./source/browser/webpack/defaultWebpackConfig.ts) that `@typed/test` will use. The function will get called _with_ the default configuration so that you can re-use any aspects you need. 
Regardless of the `entry` and `output` options you might specify, the ones `@typed/test` generates will always override them.

```typescript
import { Options, WebpackConfig } from '@typed/test'
// It's definitely recommended to use a tool like webpack-merge
// To help you extend the default configuration.
// https://github.com/survivejs/webpack-merge
import * as webpackMerge from 'webpack-merge'

const config: Options = {
  mode: 'browser',
  watch: true,
  webpackConfigurations = (defaultConfig: WebpackConfig): WebpackConfig => 
    webpackMerge(defaultConfig, require('./path/to/my-webpack-config.js'))
}
```

### Multiple Configurations

Want to run your tests from multiple browsers, or some tests within node and 
the rest in a browser? Multiple configurations has got you covered.

```typescript
import { Options } from '@typed/test'

const nodeConfig: Options = {
  files: ['source/**/*.test.ts']
}

const browserConfig: Options = {
  files: ['source/**/*.test.ts'],
  mode: 'browser',
}

// Just return an array to use multiple configurations
export default [ nodeConfig, browserConfig ]
```