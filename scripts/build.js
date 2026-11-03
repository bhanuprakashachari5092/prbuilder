import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const identityDir = path.resolve(rootDir, 'kaizenq-identity')

console.log('Building PR Builder identity frontend...')

// Run build inside kaizenq-identity directly via node executable (safe with paths containing & or spaces)
const buildScript = path.resolve(identityDir, 'scripts', 'build.js')
const result = spawnSync(process.execPath, [buildScript], {
  stdio: 'inherit',
  cwd: identityDir,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

// Synchronize build artifacts to root dist directory for static deployers looking at root
const sourceDist = path.resolve(identityDir, 'dist')
const targetDist = path.resolve(rootDir, 'dist')

if (fs.existsSync(sourceDist)) {
  fs.mkdirSync(targetDist, { recursive: true })
  fs.cpSync(sourceDist, targetDist, { recursive: true })
  console.log('✓ Root dist directory synchronized successfully.')
}
