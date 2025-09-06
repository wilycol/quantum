// src/services/market.ts
import { CLIENT_FEED_MODE } from '../lib/mode';
import { Candle, mapBinanceKlines } from '../types/candle';

export async function getKlines(symbol: string, interval: string, limit = 500) {
  if (CLIENT_FEED_MODE === 'mock') {
    return { ok: true, data: [] as Candle[] };
  }
  const url = `/api/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok || j?.ok === false) throw new Error(j?.error || 'klines failed');
  return { ok: true, data: mapBinanceKlines(j.data as any[]) };
}
