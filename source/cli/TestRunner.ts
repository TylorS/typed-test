import { Logger, TestMetadata } from '../types'
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

export class TestRunner {
  public cwd: string
  public options: TypedTestOptions
  public results: Results
  public logger: Logger
  private run: (
    options: TypedTestOptions,
    cwd: string,
    logger: Logger,
    testMetadata: TestMetadata[],
  ) => Promise<StatsAndResults>

  constructor(
    logger: Logger,
    cwd: string = process.cwd(),
    userOptions?: Partial<TypedTestOptions>,
  ) {
    const options: TypedTestOptions = {
      ...defaultOptions,
      ...userOptions,
    }

    this.logger = logger
    this.cwd = cwd
    this.options = options
    this.results = new Results()
    this.run = options.mode === 'node' ? runNodeTests : runBrowserTests
  }

  public runTests = async (
    metadata: TestMetadata[],
  ): Promise<[StatsAndResults, ProcessResults]> => {
    const { run, options, cwd, logger } = this
    const { typeCheck } = options

    const sourcePaths = Array.from(new Set(metadata.map(x => x.filePath)))
    const [testResults, processResults = { exitCode: 0 }] = await Promise.all([
      run(options, cwd, logger, metadata),
      typeCheck
        ? logger
            .log('Typechecking...')
            .then(() => typecheckInAnotherProcess(sourcePaths))
            .then(results => logger.log('Typechecking complete.').then(() => results))
        : Promise.resolve(void 0),
    ])

    return [testResults, processResults] as [StatsAndResults, ProcessResults]
  }
}
