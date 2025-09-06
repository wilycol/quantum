import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    build: {
      project: process.env.VERCEL_PROJECT_PRODUCTION_URL || null,
      env: process.env.VERCEL_ENV || null,                 // development | preview | production
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
    }
  });
}
