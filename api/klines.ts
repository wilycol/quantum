// api/klines.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
const PUBLIC_BASE = process.env.BINANCE_SPOT_TESTNET_BASE || 'https://testnet.binance.vision';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const symbol = (req.query.symbol as string) || 'BTCUSDT';
    const interval = (req.query.interval as string) || '1m';
    const limit = Number(req.query.limit || 500);
    const url = `${PUBLIC_BASE}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;

    const r = await fetch(url, { cache: 'no-store' });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ ok: false, where: 'klines', error: text });

    let data: any; try { data = JSON.parse(text); } catch { data = text; }
    res.status(200).json({ ok: true, data });
  } catch (e: any) {
    console.error('[klines] error:', e?.message);
    res.status(500).json({ ok: false, where: 'klines', error: e?.message || 'unknown' });
  }
}
