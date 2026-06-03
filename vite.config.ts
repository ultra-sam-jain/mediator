import { defineConfig, loadEnv, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'

async function handleDevApi(
  server: ViteDevServer,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = req.url ?? ''
  if (!url.startsWith('/api/')) return false

  if (url.startsWith('/api/auth/login')) {
    const { handleAuthLogin } = await server.ssrLoadModule('/lib/handlers/auth.ts')
    await handleAuthLogin(req, res)
    return true
  }
  if (url.startsWith('/api/auth/logout')) {
    const { handleAuthLogout } = await server.ssrLoadModule('/lib/handlers/auth.ts')
    await handleAuthLogout(req, res)
    return true
  }
  if (url.startsWith('/api/auth/me')) {
    const { handleAuthMe } = await server.ssrLoadModule('/lib/handlers/auth.ts')
    await handleAuthMe(req, res)
    return true
  }
  if (url.startsWith('/api/webhook')) {
    const { handleWebhook } = await server.ssrLoadModule('/lib/handlers/webhook.ts')
    await handleWebhook(req, res, url)
    return true
  }
  if (url.startsWith('/api/leads')) {
    const { handleLeads } = await server.ssrLoadModule('/lib/handlers/leads.ts')
    await handleLeads(req, res, url)
    return true
  }
  if (url.startsWith('/api/stats')) {
    const { handleStats } = await server.ssrLoadModule('/lib/handlers/stats.ts')
    await handleStats(req, res)
    return true
  }
  if (url.startsWith('/api/retry')) {
    const { handleRetry } = await server.ssrLoadModule('/lib/handlers/retry.ts')
    await handleRetry(req, res)
    return true
  }

  return false
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'lead-redirector-dev-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          handleDevApi(server, req, res)
            .then((handled) => {
              if (!handled) next()
            })
            .catch((err) => {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : 'Server error',
                }),
              )
            })
        })
      },
    },
  ],
  ssr: {
    noExternal: true,
  },
  }
})
