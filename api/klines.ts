// api/klines.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { regions: ['cdg1', 'fra1', 'hnd1'] };

const DATA_BASE = process.env.BINANCE_SPOT_DATA_BASE; // p.ej. https://data-api.binance.vision
const TESTNET_BASE = process.env.BINANCE_SPOT_TESTNET_BASE || 'https://testnet.binance.vision';

async function call(base: string, symbol: string, interval: string, limit: number) {
  const url = `${base}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const r = await fetch(url, { cache: 'no-store' });
  const text = await r.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!r.ok) {
    return { ok: false, status: r.status, error: typeof data === 'string' ? data : JSON.stringify(data), source: base };
  }
  return { ok: true, data, source: base };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const symbol = (req.query.symbol as string) || 'BTCUSDT';
    const interval = (req.query.interval as string) || '1m';
    const limit = Number(req.query.limit || 500);

    // 1) intenta DATA API si está configurada
    if (DATA_BASE) {
      const a = await call(DATA_BASE, symbol, interval, limit);
      if (a.ok) return res.status(200).json(a);
      // si es 451/403, intentamos fallback; si es otro error, devolvemos ya
      if (a.status !== 451 && a.status !== 403) {
        return res.status(a.status || 500).json({ ok: false, where: 'klines', ...a });
      }
    }

    // 2) fallback a TESTNET BASE
    const b = await call(TESTNET_BASE, symbol, interval, limit);
    if (b.ok) return res.status(200).json(b);
    return res.status(b.status || 500).json({ ok: false, where: 'klines', ...b });
  } catch (e: any) {
    return res.status(500).json({ ok: false, where: 'klines', error: e?.message || 'unknown' });
  }
}