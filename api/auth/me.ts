import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleAuthMe } from '../../lib/handlers/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleAuthMe(req, res)
}
