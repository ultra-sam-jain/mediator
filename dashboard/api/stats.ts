import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleStats } from '../lib/handlers/stats'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleStats(req, res)
}
