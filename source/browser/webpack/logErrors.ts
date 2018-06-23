import { Stats } from 'webpack'

export function logErrors(err: Error | null, stats: Stats): void {
  if (err) {
    console.error(err.stack)

    process.exit(1)
  }

  const { errors } = stats.toJson()

  if (stats.hasErrors()) {
    errors.forEach((e: any) => console.error(e))

    process.exit(1)
  }
}
