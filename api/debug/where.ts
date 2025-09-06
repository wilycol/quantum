// api/debug/where.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
export const config = { regions: ['cdg1', 'fra1', 'hnd1'] };
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    vercelEnv: process.env.VERCEL_ENV,
    vercelRegion: (process as any).env?.VERCEL_REGION || process.env.VERCEL_REGION || null,
    ts: Date.now(),
  });
}
