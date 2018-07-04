#!/usr/bin/env node

import { createProgram } from 'typescript'
import { findTsConfig } from './findTsConfig'
import { typeCheckFiles } from './typeCheckFiles'

const files = process.argv.slice(2)
const { compilerOptions } = findTsConfig()
const program = createProgram(files, compilerOptions)
const result = typeCheckFiles(program)

if (result === '') {
  process.exit(0)
}

console.error(result)
process.exit(1)
