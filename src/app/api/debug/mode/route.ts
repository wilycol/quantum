import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    TRADING_MODE: process.env.TRADING_MODE || null,
    NEXT_PUBLIC_TRADING_MODE: process.env.NEXT_PUBLIC_TRADING_MODE || null,
    BINANCE_SPOT_TESTNET_BASE: process.env.BINANCE_SPOT_TESTNET_BASE || null,
    HAS_BINANCE_API_KEY: !!process.env.BINANCE_API_KEY,
    HAS_BINANCE_API_SECRET: !!process.env.BINANCE_API_SECRET,
    timestamp: Date.now()
  });
}
