/**
 * CLI script to generate docs/openapi.yaml from Zod schemas.
 * Run: pnpm openapi:generate
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { dump } from 'js-yaml'
import { generateSpec } from './shared/infrastructure/openapi/generator'

const spec = generateSpec()
const yaml = dump(spec, { indent: 2, lineWidth: 120, noRefs: true })

const outDir = join(__dirname, '..', 'docs')
mkdirSync(outDir, { recursive: true })

const outPath = join(outDir, 'openapi.yaml')
writeFileSync(outPath, yaml, 'utf-8')

console.log(`✓ OpenAPI spec written to ${outPath}`)
