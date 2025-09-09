// api/binance/time.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { serverTime } from '../../lib/binance';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try { const info = await serverTime(); res.status(200).json({ ok:true, info }); }
  catch (e:any) { res.status(500).json({ ok:false, error:e?.message }); }
}
