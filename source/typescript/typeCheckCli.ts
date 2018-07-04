#!/usr/bin/env node

import { createProgram } from 'typescript'
import { findTsConfig } from './findTsConfig'
import { typeCheckFiles } from './typeCheckFiles'

const cwd = process.argv[2]
const files = process.argv.slice(3)
const { compilerOptions } = findTsConfig(cwd)
const program = createProgram(files, compilerOptions)
const result = typeCheckFiles(program)

if (result === '') {
  process.exit(0)
}

console.error(result)
process.exit(1)
