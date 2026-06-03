import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleAuthLogout } from '../../lib/handlers/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleAuthLogout(req, res)
}
