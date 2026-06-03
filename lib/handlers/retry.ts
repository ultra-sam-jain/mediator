import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../authService.js'
import { retryLead } from '../dataService.js'
import { readRawBody, sendJson } from '../apiUtils.js'

type Req = IncomingMessage | VercelRequest
type Res = ServerResponse | VercelResponse

export async function handleRetry(req: Req, res: Res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  if (!requireAdmin(req, res)) return

  const raw = await readRawBody(req)
  let id = ''
  try {
    const body = JSON.parse(raw) as { id?: string }
    id = body.id ?? ''
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' })
    return
  }

  if (!id) {
    sendJson(res, 400, { error: 'Missing lead id' })
    return
  }

  const result = await retryLead(id)
  sendJson(res, result.ok ? 200 : 502, result)
}
