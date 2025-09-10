import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export function requireAdmin(req: VercelRequest, res: VercelResponse): { ok: boolean; payload?: any } {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return { ok: false };
  }

  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return { ok: true, payload };
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return { ok: false };
  }
}