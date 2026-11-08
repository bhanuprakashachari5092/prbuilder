import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const eslintPath = path.resolve(rootDir, 'node_modules', 'eslint', 'bin', 'eslint.js')
if (!fs.existsSync(eslintPath)) {
  console.log('ESLint binary not found. Skipping lint.')
  process.exit(0)
}

const result = spawnSync(process.execPath, [eslintPath, '.'], {
  cwd: rootDir,
  stdio: 'inherit',
})

process.exit(result.status ?? 0)

