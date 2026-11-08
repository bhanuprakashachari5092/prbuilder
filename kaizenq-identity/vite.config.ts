import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function cashfreeApiDevPlugin() {
  return {
    name: 'cashfree-api-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/cashfree-order' || req.url?.startsWith('/api/cashfree-order?')) {
          // @ts-expect-error dynamic JS handler
          const { default: handler } = await import('./api/cashfree-order.js')
          let body = ''
          req.on('data', (chunk: any) => (body += chunk))
          req.on('end', async () => {
            req.body = body ? JSON.parse(body) : {}
            res.status = (code: number) => {
              res.statusCode = code
              return res
            }
            res.json = (data: any) => {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            }
            await handler(req, res)
          })
          return
        }
        if (req.url === '/api/cashfree-verify' || req.url?.startsWith('/api/cashfree-verify?')) {
          // @ts-expect-error dynamic JS handler
          const { default: handler } = await import('./api/cashfree-verify.js')
          let body = ''
          req.on('data', (chunk: any) => (body += chunk))
          req.on('end', async () => {
            req.body = body ? JSON.parse(body) : {}
            res.status = (code: number) => {
              res.statusCode = code
              return res
            }
            res.json = (data: any) => {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            }
            await handler(req, res)
          })
          return
        }
        if (req.url === '/api/gemini' || req.url?.startsWith('/api/gemini?')) {
          // @ts-expect-error dynamic JS handler
          const { default: handler } = await import('./api/gemini.js')
          let body = ''
          req.on('data', (chunk: any) => (body += chunk))
          req.on('end', async () => {
            req.body = body ? JSON.parse(body) : {}
            res.status = (code: number) => {
              res.statusCode = code
              return res
            }
            res.json = (data: any) => {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            }
            await handler(req, res)
          })
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cashfreeApiDevPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4173,
    allowedHosts: true,
  },
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5173,
    allowedHosts: true,
  },
})


