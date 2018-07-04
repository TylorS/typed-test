import { collectByKey } from '../common/collectByKey'
import { flatten } from '../common/flatten'
import { JsonResults } from '../types'

export class Results {
  private resultsMap = new Map<string, JsonResults[]>()

  public getResults = () => {
    return flatten(Array.from(this.resultsMap.values()))
  }

  public updateResults = (results: JsonResults[]) => {
    const resultsByFilePath = collectByKey(x => x.filePath, results)
    const filePaths = Object.keys(resultsByFilePath)

    filePaths.forEach(filePath => {
      this.resultsMap.set(filePath, resultsByFilePath[filePath])
    })

    return this.getResults()
  }

  public removeFilePath = (filePath: string) => {
    this.resultsMap.delete(filePath)

    return this.getResults()
  }
}
