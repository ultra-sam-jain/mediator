import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleRetry } from '../lib/handlers/retry.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleRetry(req, res)
}
