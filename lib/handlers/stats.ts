import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getStats } from '../dataService.js'
import { sendJson, setCors } from '../apiUtils.js'

type Req = IncomingMessage | VercelRequest
type Res = ServerResponse | VercelResponse

export async function handleStats(req: Req, res: Res) {
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

  const stats = await getStats()
  sendJson(res, 200, stats)
}
