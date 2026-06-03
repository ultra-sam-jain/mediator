import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleHousingStatus } from '../../lib/handlers/housing.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleHousingStatus(req, res)
}
