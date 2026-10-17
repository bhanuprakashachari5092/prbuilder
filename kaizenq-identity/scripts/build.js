import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('Running TypeScript check...')
execSync(`node "${path.join(rootDir, 'node_modules/typescript/bin/tsc')}" -b`, {
  stdio: 'inherit',
  cwd: rootDir,
})

console.log('Building Vite production bundle...')
execSync(`node "${path.join(rootDir, 'node_modules/vite/bin/vite.js')}" build`, {
  stdio: 'inherit',
  cwd: rootDir,
})

console.log('✓ Build completed successfully.')
