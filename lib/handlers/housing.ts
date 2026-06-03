import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../authService.js'
import { isHousingConfigured } from '../housing/housingConfig.js'
import { syncHousingLeadsFromApi } from '../housing/housingPull.js'
import { sendJson, setCors } from '../apiUtils.js'

type Req = IncomingMessage | VercelRequest
type Res = ServerResponse | VercelResponse

export async function handleHousingStatus(req: Req, res: Res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }
  if (!requireAdmin(req, res)) return

  const creds = isHousingConfigured()
  const profileId = process.env.HOUSING_PROFILE_ID?.trim()
  sendJson(res, 200, {
    configured: creds,
    profileId: profileId ? `${profileId.slice(0, 2)}***${profileId.slice(-2)}` : null,
    hasEncryptionKey: Boolean(process.env.HOUSING_ENCRYPTION_KEY?.trim()),
    pullApiUrl: process.env.HOUSING_PULL_API_URL?.trim() || null,
  })
}

export async function handleHousingSync(req: Req, res: Res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  // Allow GET for Vercel Cron Jobs (automatically authenticated by Vercel via CRON_SECRET), and POST for manual admin UI sync
  const isVercelCron =
    req.method === 'GET' &&
    process.env.CRON_SECRET &&
    req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`

  if (req.method !== 'POST' && !isVercelCron) {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  if (!isVercelCron && !requireAdmin(req, res)) return

  const result = await syncHousingLeadsFromApi()
  sendJson(res, result.ok ? 200 : 502, result)
}
