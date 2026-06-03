import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleAuthLogin } from '../../lib/handlers/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleAuthLogin(req, res)
}
