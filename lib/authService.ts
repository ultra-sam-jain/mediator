import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendJson } from './apiUtils.js'

const COOKIE_NAME = 'admin_session'
const SESSION_DAYS = 7

type Req = IncomingMessage | VercelRequest
type Res = ServerResponse | VercelResponse

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() ?? ''
}

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET?.trim() || adminPassword()
}

export function isAuthConfigured(): boolean {
  return adminPassword().length >= 8
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
}

function createSessionToken(): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', exp })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !sessionSecret()) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payload, sig] = parts
  const expected = sign(payload)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    if (!timingSafeEqual(a, b)) return false
  } catch {
    return false
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string
      exp?: number
    }
    if (data.sub !== 'admin' || typeof data.exp !== 'number') return false
    if (Date.now() > data.exp) return false
    return true
  } catch {
    return false
  }
}

export function getSessionCookie(req: Req): string | undefined {
  const raw = req.headers.cookie
  if (!raw) return undefined
  for (const part of raw.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(`${COOKIE_NAME}=`)) {
      return decodeURIComponent(trimmed.slice(COOKIE_NAME.length + 1))
    }
  }
  return undefined
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

export function setSessionCookie(res: Res, token: string) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60
  const secure = isProduction() ? '; Secure' : ''
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
  res.setHeader('Set-Cookie', cookie)
}

export function clearSessionCookie(res: Res) {
  const secure = isProduction() ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  )
}

export function verifyAdminPassword(password: string): boolean {
  const expected = adminPassword()
  if (!expected || !password) return false
  try {
    const a = Buffer.from(password, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Returns false and sends 401/503 if not authenticated. */
export function requireAdmin(req: Req, res: Res): boolean {
  if (!isAuthConfigured()) {
    sendJson(res, 503, { error: 'Admin login is not configured. Set ADMIN_PASSWORD on the server.' })
    return false
  }
  const token = getSessionCookie(req)
  if (!verifySessionToken(token)) {
    sendJson(res, 401, { error: 'Unauthorized' })
    return false
  }
  return true
}

export function createSession(): string {
  return createSessionToken()
}

/** Optional constant-time delay on failed login (mitigate brute force). */
export async function authDelay(): Promise<void> {
  const ms = 400 + randomBytes(1)[0] % 200
  await new Promise((r) => setTimeout(r, ms))
}
