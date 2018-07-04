import { sync } from 'glob'
import { flatten } from '../common/flatten'

export function getScriptFileNames(cwd: string, fileGlobs: string[]): string[] {
  return flatten(fileGlobs.map(x => sync(x, { cwd })))
}
