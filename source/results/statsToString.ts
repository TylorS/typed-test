import { blue, green, red } from 'typed-colors'
import { TestStats } from './getTestStats'

export function statsToString({ passing, failing, skipped }: TestStats): string {
  let str = `\n${green(String(passing))} Passed`

  if (failing > 0) {
    str += ` - ${red(String(failing))} Failed`
  }

  if (skipped > 0) {
    str += ` - ${blue(String(skipped))} Skipped`
  }

  return str + `\n`
}
