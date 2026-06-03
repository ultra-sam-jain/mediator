import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export function setCors(res: ServerResponse | VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function sendJson(
  res: ServerResponse | VercelResponse,
  status: number,
  data: unknown,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export async function readRawBody(req: IncomingMessage | VercelRequest): Promise<string> {
  const vercelReq = req as VercelRequest
  if (vercelReq.body !== undefined && vercelReq.body !== null) {
    if (typeof vercelReq.body === 'string') return vercelReq.body
    if (Buffer.isBuffer(vercelReq.body)) return vercelReq.body.toString('utf8')
    if (typeof vercelReq.body === 'object') return JSON.stringify(vercelReq.body)
  }

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export function getQueryParam(
  url: string | undefined,
  key: string,
): string | undefined {
  if (!url) return undefined
  try {
    const params = new URL(url, 'http://localhost').searchParams
    return params.get(key) ?? undefined
  } catch {
    return undefined
  }
}
