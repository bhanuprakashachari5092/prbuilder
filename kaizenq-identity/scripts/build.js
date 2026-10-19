import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('Running TypeScript check...')
const tscPath = path.resolve(rootDir, 'node_modules/typescript/bin/tsc')
const tscResult = spawnSync(process.execPath, [tscPath, '-b'], {
  stdio: 'inherit',
  cwd: rootDir,
})

if (tscResult.status !== 0) {
  process.exit(tscResult.status ?? 1)
}

console.log('Building Vite production bundle...')
const vitePath = path.resolve(rootDir, 'node_modules/vite/bin/vite.js')
const viteResult = spawnSync(process.execPath, [vitePath, 'build'], {
  stdio: 'inherit',
  cwd: rootDir,
})

if (viteResult.status !== 0) {
  process.exit(viteResult.status ?? 1)
}

console.log('✓ Build completed successfully.')
