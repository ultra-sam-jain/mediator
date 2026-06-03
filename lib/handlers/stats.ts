import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../authService.js'
import { getStats } from '../dataService.js'
import { sendJson } from '../apiUtils.js'

type Req = IncomingMessage | VercelRequest
type Res = ServerResponse | VercelResponse

export async function handleStats(req: Req, res: Res) {
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

  const stats = await getStats()
  sendJson(res, 200, stats)
}
