// api/debug/consolidated.ts - Consolidated debug functions
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { action = 'env' } = req.query;

    switch (action) {
      case 'env':
        return res.status(200).json({
          build: {
            env: process.env.VERCEL_ENV || null,
            commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
            branch: process.env.VERCEL_GIT_COMMIT_REF || null,
            buildTime: new Date().toISOString(),
          },
          trading: {
            TRADING_MODE: process.env.TRADING_MODE || null,
            NEXT_PUBLIC_TRADING_MODE: process.env.NEXT_PUBLIC_TRADING_MODE || null,
          },
          binance: {
            BINANCE_SPOT_TESTNET_BASE: process.env.BINANCE_SPOT_TESTNET_BASE || null,
            HAS_BINANCE_API_KEY: !!process.env.BINANCE_API_KEY,
            HAS_BINANCE_API_SECRET: !!process.env.BINANCE_API_SECRET,
          },
        });

      case 'feed':
        const env = {
          VERCEL_ENV: process.env.VERCEL_ENV || null,
          TRADING_MODE: process.env.TRADING_MODE || null,
          NEXT_PUBLIC_TRADING_MODE: process.env.NEXT_PUBLIC_TRADING_MODE || null,
          VITE_DATA_MODE: process.env.VITE_DATA_MODE || null,
          BINANCE_SPOT_TESTNET_BASE: process.env.BINANCE_SPOT_TESTNET_BASE || null,
          HAS_BINANCE_API_KEY: !!process.env.BINANCE_API_KEY,
          HAS_BINANCE_API_SECRET: !!process.env.BINANCE_API_SECRET,
          ts: Date.now(),
        };

        // ping sencillo a klines (no bloqueante)
        let klinesOk: boolean | string = false;
        try {
          const base = process.env.BINANCE_SPOT_TESTNET_BASE || 'https://testnet.binance.vision';
          const r = await fetch(`${base}/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1`, { cache: 'no-store' });
          klinesOk = r.ok ? true : `status ${r.status}`;
        } catch (e: any) {
          klinesOk = e?.message || 'fetch error';
        }

        return res.status(200).json({ ok: true, env, klinesOk });

      case 'where':
        return res.status(200).json({
          ok: true,
          vercelEnv: process.env.VERCEL_ENV,
          vercelRegion: (process as any).env?.VERCEL_REGION || process.env.VERCEL_REGION || null,
          ts: Date.now(),
        });

      default:
        return res.status(400).json({ error: 'Invalid action. Use: env, feed, or where' });
    }
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'unknown' });
  }
}
