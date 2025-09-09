// api/klines.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const region = process.env.VERCEL_REGION || 'unknown';
  const primary = process.env.BINANCE_SPOT_DATA_BASE || 'https://data-api.binance.vision';
  const fallbacks = [
    process.env.BINANCE_SPOT_TESTNET_BASE || 'https://testnet.binance.vision',
    'https://api.binance.com'
  ];

  const { symbol = 'BTCUSDT', interval = '1m', limit = '500' } = (req.query ?? {}) as Record<string, string>;
  const path = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  const tryFetch = async (base: string) => {
    const url = `${base}${path}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'QuantumTrade/1.0' }, cache: 'no-store' });
    return { r, base, url };
  };

  try {
    let { r, base, url } = await tryFetch(primary);
    console.log('[INFO] klines primary', { url, status: r.status, region });

    if ([451, 403, 502, 503, 504].includes(r.status)) {
      for (const fb of fallbacks) {
        const a = await tryFetch(fb);
        console.log('[INFO] klines fallback', { url: a.url, status: a.r.status, region });
        if (a.r.ok) { r = a.r; base = a.base; url = a.url; break; }
      }
    }

    const text = await r.text();
    let raw: any;
    try { raw = JSON.parse(text); } catch { raw = []; }

    if (!r.ok || !Array.isArray(raw)) {
      console.error('[ERROR] klines non-200', { status: r.status, base, url, region });
      res.status(r.status)
        .setHeader('X-Data-Host', base)
        .setHeader('X-QT-Host', base)
        .setHeader('X-Vercel-Region', region)
        .json({ ok: false, error: `binance_${r.status}`, source: base, url });
      return;
    }

    res.status(200)
      .setHeader('X-Data-Host', base)    // para ver el host en Network
      .setHeader('X-QT-Host', base)      // compat con dataFeed.ts
      .setHeader('X-Vercel-Region', region)
      .json({ ok: true, data: raw });
  } catch (e: any) {
    console.error('[ERROR] klines exception', { err: String(e?.message || e), region });
    res.status(500)
      .setHeader('X-Vercel-Region', region)
      .json({ ok: false, error: 'server_error', detail: String(e?.message || e) });
  }
}