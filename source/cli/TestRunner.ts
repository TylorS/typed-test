import { CompilerOptions } from 'typescript'
import { TestMetadata } from '../types'
import { findTsConfig } from '../typescript/findTsConfig'
import { ProcessResults, typecheckInAnotherProcess } from '../typescript/typeCheckInAnotherProcess'
import { Results } from './Results'
import { runBrowserTests } from './runBrowserTests'
import { runNodeTests } from './runNodeTests'
import { StatsAndResults, TypedTestOptions } from './types'

const defaultOptions: TypedTestOptions = {
  mode: 'node',
  timeout: 2000,
  browser: 'chrome-headless',
  keepAlive: false,
  typeCheck: false,
  watch: false,
}

const EXCLUDE = ['./node_modules/**']

export class TestRunner {
  public cwd: string
  public options: TypedTestOptions
  public results: Results
  public fileGlobs: string[]
  public compilerOptions: CompilerOptions
  public configPath: string
  private run: (
    options: TypedTestOptions,
    cwd: string,
    testMetadata: TestMetadata[],
  ) => Promise<StatsAndResults>

  constructor(cwd: string = process.cwd(), userOptions?: Partial<TypedTestOptions>) {
    const options: TypedTestOptions = {
      ...defaultOptions,
      ...userOptions,
    }

    const {
      configPath,
      compilerOptions,
      files = [],
      include = [],
      exclude = EXCLUDE,
    } = findTsConfig()
    const fileGlobs = [...files, ...include, ...exclude.map(x => `!${x}`)]

    this.cwd = cwd
    this.options = options
    this.results = new Results()
    this.run = options.mode === 'node' ? runNodeTests : runBrowserTests
    this.fileGlobs = fileGlobs
    this.compilerOptions = compilerOptions
    this.configPath = configPath
  }

  public runTests = async (
    metadata: TestMetadata[],
  ): Promise<[StatsAndResults, ProcessResults]> => {
    const { run, options, cwd, results } = this
    const { typeCheck } = options

    const sourcePaths = Array.from(new Set(metadata.map(x => x.filePath)))
    const [testResults, processResults = { exitCode: 0 }] = await Promise.all([
      run(options, cwd, metadata).then(x => ({
        ...x,
        results: results.updateResults(x.results),
      })),
      typeCheck ? typecheckInAnotherProcess(sourcePaths) : Promise.resolve(void 0),
    ])

    return [testResults, processResults] as [StatsAndResults, ProcessResults]
  }
}
