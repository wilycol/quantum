// api/binance/balances.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSpotBalances, ping, serverTime } from '../../lib/binance';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // sanity checks
    await ping().catch(() => {}); // no bloquea si falla
    const timeInfo = await serverTime().catch((e) => ({ error: (e as any)?.message }));

    const data = await getSpotBalances();
    return res.status(200).json({ ok: true, data, timeInfo });
  } catch (e: any) {
    console.error('[balances] error:', e?.message);
    return res.status(500).json({
      ok: false,
      where: 'balances',
      error: e?.message || 'unknown',
    });
  }
}
