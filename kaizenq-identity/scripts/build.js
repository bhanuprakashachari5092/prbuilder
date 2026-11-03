import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const require = createRequire(import.meta.url)

function findBinary(name, relativeBinPath) {
  // 1. Direct inside local node_modules
  const localPath = path.resolve(rootDir, 'node_modules', relativeBinPath)
  if (fs.existsSync(localPath)) return localPath

  // 2. Hoisted in parent / root node_modules
  const parentPath = path.resolve(rootDir, '..', 'node_modules', relativeBinPath)
  if (fs.existsSync(parentPath)) return parentPath

  // 3. Via node module resolution
  try {
    const resolved = require.resolve(`${name}/${relativeBinPath}`)
    if (fs.existsSync(resolved)) return resolved
  } catch {}

  return null
}

// Ensure dependencies are installed if missing
let tscPath = findBinary('typescript', 'typescript/bin/tsc')
let vitePath = findBinary('vite', 'vite/bin/vite.js')

if (!tscPath || !vitePath) {
  console.log('Dependencies not found. Running npm install in kaizenq-identity...')
  const installResult = spawnSync('npm', ['install'], {
    stdio: 'inherit',
    cwd: rootDir,
    shell: true,
  })
  if (installResult.status !== 0) {
    console.error('Failed to install dependencies.')
    process.exit(installResult.status ?? 1)
  }

  tscPath = findBinary('typescript', 'typescript/bin/tsc')
  vitePath = findBinary('vite', 'vite/bin/vite.js')
}

if (!tscPath) {
  console.error('Error: Could not locate typescript compiler (tsc).')
  process.exit(1)
}

if (!vitePath) {
  console.error('Error: Could not locate vite binary.')
  process.exit(1)
}

console.log('Running TypeScript check...')
const tscResult = spawnSync(process.execPath, [tscPath, '-b'], {
  stdio: 'inherit',
  cwd: rootDir,
})

if (tscResult.status !== 0) {
  process.exit(tscResult.status ?? 1)
}

console.log('Building Vite production bundle...')
const viteResult = spawnSync(process.execPath, [vitePath, 'build'], {
  stdio: 'inherit',
  cwd: rootDir,
})

if (viteResult.status !== 0) {
  process.exit(viteResult.status ?? 1)
}

console.log('Generating SPA fallback and client route entry points...')
const distDir = path.resolve(rootDir, 'dist')
const indexHtmlPath = path.resolve(distDir, 'index.html')

if (fs.existsSync(indexHtmlPath)) {
  // 1. Generate 404.html fallback for static hosts (GitHub Pages, Netlify, Vercel)
  fs.copyFileSync(indexHtmlPath, path.resolve(distDir, '404.html'))

  // 2. Generate static /auth/callback/index.html route entry point
  const authCallbackDir = path.resolve(distDir, 'auth', 'callback')
  fs.mkdirSync(authCallbackDir, { recursive: true })
  fs.copyFileSync(indexHtmlPath, path.resolve(authCallbackDir, 'index.html'))

  // 3. Generate static /auth/index.html route entry point
  const authDir = path.resolve(distDir, 'auth')
  fs.mkdirSync(authDir, { recursive: true })
  fs.copyFileSync(indexHtmlPath, path.resolve(authDir, 'index.html'))

  console.log('✓ SPA static route fallbacks created successfully.')
}

console.log('✓ Build completed successfully.')
