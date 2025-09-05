import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    name: 'dispo-qr',
    ts: new Date().toISOString(),
    runtime: 'serverless',
  })
}