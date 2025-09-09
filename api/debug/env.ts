// api/debug/env.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    build: {
      env: process.env.VERCEL_ENV || null,               // development | preview | production
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
}
