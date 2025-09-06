// api/klines.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logInfo, logError, vercelRegion } from '../lib/log';

const PRIMARY_BASE =
  process.env.BINANCE_SPOT_DATA_BASE || 'https://data-api.binance.vision';

const FALLBACK_BASES = [
  process.env.BINANCE_SPOT_TESTNET_BASE || 'https://testnet.binance.vision',
  'https://api.binance.com'
];

export const config = {
  runtime: 'nodejs18.x',
  regions: ['fra1'] // una sola región por plan free
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { symbol = 'BTCUSDT', interval = '1m', limit = '500' } = (req.query ?? {}) as Record<string, string>;
    const path = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const tryFetch = async (base: string) => {
      const url = `${base}${path}`;
      const r = await fetch(url, { headers: { 'User-Agent': 'QuantumTrade/1.0' } });
      return { r, base, url };
    };

    // intento primario
    let { r, base, url } = await tryFetch(PRIMARY_BASE);
    logInfo('klines primary attempt', { url, status: r.status });

    // fallback si 451/403/5xx
    if ([451, 403, 502, 503, 504].includes(r.status)) {
      for (const fb of FALLBACK_BASES) {
        const attempt = await tryFetch(fb);
        logInfo('klines fallback attempt', { url: attempt.url, status: attempt.r.status });
        if (attempt.r.ok) { r = attempt.r; base = attempt.base; url = attempt.url; break; }
      }
    }

    const ok = r.ok;
    const bodyText = await r.text(); // conserva respuesta aun si no es JSON
    let body: any = null;
    try { body = JSON.parse(bodyText); } catch { body = { raw: bodyText }; }

    if (!ok) {
      logError('klines final non-200', { status: r.status, base, url });
      res
        .status(r.status)
        .setHeader('X-Data-Host', base)
        .setHeader('X-Vercel-Region', vercelRegion())
        .json({ error: `binance_${r.status}`, source: base, url });
      return;
    }

    res
      .status(200)
      .setHeader('X-Data-Host', base)
      .setHeader('X-Vercel-Region', vercelRegion())
      .json(body);
  } catch (err: any) {
    logError('klines exception', { error: String(err?.message || err) });
    res
      .status(500)
      .setHeader('X-Vercel-Region', vercelRegion())
      .json({ error: 'server_error', detail: String(err?.message || err) });
  }
}