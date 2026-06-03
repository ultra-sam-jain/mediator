import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLeads } from '../dataService.js'
import type { LeadStatus } from '../types.js'
import { getQueryParam, sendJson, setCors } from '../apiUtils.js'

type Req = IncomingMessage | VercelRequest
type Res = ServerResponse | VercelResponse

export async function handleLeads(req: Req, res: Res, requestUrl?: string) {
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

  const url = requestUrl ?? ('url' in req ? req.url : undefined)
  const source = getQueryParam(url, 'source') ?? undefined
  const status = (getQueryParam(url, 'status') as LeadStatus | undefined) ?? undefined
  const search = getQueryParam(url, 'search') ?? undefined
  const page = Number(getQueryParam(url, 'page') ?? '1')
  const limit = Number(getQueryParam(url, 'limit') ?? '50')

  const data = await getLeads({ source, status, search, page, limit })
  sendJson(res, 200, data)
}
