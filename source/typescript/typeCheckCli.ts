import { createProgram } from 'typescript'
import { typeCheckFiles } from '.'
import { findTsConfig } from './findTsConfig'

const files = process.argv.slice(2)
const { compilerOptions } = findTsConfig()
const program = createProgram(files, compilerOptions)
const result = typeCheckFiles(program)

if (result === '') {
  console.log('Typechecking complete')
  process.exit(0)
}

console.error(result)
process.exit(1)
