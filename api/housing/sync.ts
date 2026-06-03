import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleHousingSync } from '../../lib/handlers/housing.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleHousingSync(req, res)
}
