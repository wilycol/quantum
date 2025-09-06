// api/binance/balances.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSpotBalances } from '../../lib/binance';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const data = await getSpotBalances();
    res.status(200).json({ ok: true, data });
  } catch (e: any) {
    console.error('[balances] error:', e?.message, e?.stack);
    res.status(500).json({ ok: false, where: 'balances', error: e?.message || 'unknown' });
  }
}
