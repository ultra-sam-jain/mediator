import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleWebhook } from '../lib/handlers/webhook.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleWebhook(req, res, req.url)
}
