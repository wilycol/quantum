// api/debug/where.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
// En plan free evita fijar múltiples regiones aquí:
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    vercelEnv: process.env.VERCEL_ENV,
    vercelRegion: (process as any).env?.VERCEL_REGION || process.env.VERCEL_REGION || null,
    ts: Date.now(),
  });
}
