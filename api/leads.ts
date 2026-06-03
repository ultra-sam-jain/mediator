import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleLeads } from '../lib/handlers/leads.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleLeads(req, res, req.url)
}
