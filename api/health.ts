import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method ?? "UNKNOWN";
  res.status(200).json({
    ok: true,
    service: "dispo-qr",
    method,
    timestamp: new Date().toISOString(),
  });
}
