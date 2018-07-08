import { isAbsolute, join } from 'path'

export function makeAbsolute(cwd: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : join(cwd, filePath)
}
