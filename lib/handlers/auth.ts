import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  authDelay,
  clearSessionCookie,
  createSession,
  getSessionCookie,
  isAuthConfigured,
  setSessionCookie,
  verifyAdminPassword,
  verifySessionToken,
} from '../authService.js'
import { readRawBody, sendJson } from '../apiUtils.js'

type Req = IncomingMessage | VercelRequest
type Res = ServerResponse | VercelResponse

export async function handleAuthLogin(req: Req, res: Res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  if (!isAuthConfigured()) {
    sendJson(res, 503, {
      error: 'Set ADMIN_PASSWORD (min 8 characters) in Vercel environment variables.',
    })
    return
  }

  let password = ''
  try {
    const raw = await readRawBody(req)
    const body = JSON.parse(raw) as { password?: string }
    password = body.password ?? ''
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' })
    return
  }

  if (!verifyAdminPassword(password)) {
    await authDelay()
    sendJson(res, 401, { error: 'Invalid password' })
    return
  }

  const token = createSession()
  setSessionCookie(res, token)
  sendJson(res, 200, { ok: true })
}

export async function handleAuthLogout(req: Req, res: Res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  clearSessionCookie(res)
  sendJson(res, 200, { ok: true })
}

export async function handleAuthMe(req: Req, res: Res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  if (!isAuthConfigured()) {
    sendJson(res, 200, { authenticated: false, configured: false })
    return
  }

  const token = getSessionCookie(req)
  const authenticated = verifySessionToken(token)
  sendJson(res, 200, { authenticated, configured: true })
}
