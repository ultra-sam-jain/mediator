import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { processIncomingLead } from '../dataService.js'
import { readRequestBody } from '../parseLeadData.js'
import { parseHousingBody } from '../housing/housingInbound.js'
import { getSource } from '../sources.js'
import { getQueryParam, readRawBody, sendJson, setCors } from '../apiUtils.js'

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

  let body: Record<string, unknown>
  let housingMeta: { decrypted?: boolean; warning?: string } = {}

  if (sourceKey === 'housing') {
    const parsed = await parseHousingBody(rawBody, contentType, req.headers)
    if (parsed.warning?.includes('Profile ID mismatch')) {
      sendJson(res, 403, { error: parsed.warning })
      return
    }
    body = parsed.body
    housingMeta = { decrypted: parsed.decrypted, warning: parsed.warning }
  } else {
    body = await readRequestBody(rawBody, contentType)
  }

  const result = await processIncomingLead(sourceKey!, body)
  sendJson(res, 200, {
    ok: true,
    logId: result.logId,
    status: result.status,
    error: result.error,
    ...housingMeta,
  })
}
