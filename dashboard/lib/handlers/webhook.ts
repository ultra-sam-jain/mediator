import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { processIncomingLead } from '../dataService'
import { readRequestBody } from '../parseLeadData'
import { getSource } from '../sources'
import { getQueryParam, readRawBody, sendJson, setCors } from '../apiUtils'

type Req = IncomingMessage | VercelRequest
type Res = ServerResponse | VercelResponse

export async function handleWebhook(req: Req, res: Res, requestUrl?: string) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const url = requestUrl ?? ('url' in req ? req.url : undefined)
  const sourceKey = getQueryParam(url, 'source')?.toLowerCase()
  const source = getSource(sourceKey)

  if (!source) {
    sendJson(res, 400, { error: 'Invalid or missing ?source= parameter' })
    return
  }

  const rawBody = await readRawBody(req)
  const contentType =
    typeof req.headers['content-type'] === 'string'
      ? req.headers['content-type']
      : undefined
  const body = await readRequestBody(rawBody, contentType)

  const result = await processIncomingLead(sourceKey!, body)
  sendJson(res, 200, {
    ok: true,
    logId: result.logId,
    status: result.status,
    error: result.error,
  })
}
