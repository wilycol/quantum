// api/binance/balances.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSpotBalances } from '../../lib/binance';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const data = await getSpotBalances();
    res.status(200).json({ ok: true, data });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'unknown' });
  }
}
