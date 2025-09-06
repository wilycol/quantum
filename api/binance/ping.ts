// api/binance/ping.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ping } from '../../lib/binance';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try { await ping(); res.status(200).json({ ok: true }); }
  catch (e:any) { res.status(500).json({ ok:false, error:e?.message }); }
}
