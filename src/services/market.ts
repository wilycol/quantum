// src/services/market.ts
import { Candle, mapBinanceKlines } from '../types/candle';

export async function getKlinesLive(symbol: string, interval: string, limit = 500) {
  const url = `/api/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const r = await fetch(url, { cache: 'no-store' });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || `klines ${r.status}`);
  const arr = Array.isArray(j) ? j : (j?.data ?? []);
  if (!Array.isArray(arr)) throw new Error('bad_klines_shape');
  return mapBinanceKlines(arr as any[]);
}

export function getKlinesMock(limit = 500): Candle[] {
  // pequeño generador determinista para demo
  const now = Date.now();
  const out: Candle[] = [];
  let p = 100_000;
  for (let i=limit-1; i>=0; i--) {
    const t = now - i*60_000;
    const rnd = Math.sin(i/9)*1200 + Math.cos(i/15)*900 + (Math.random()-0.5)*400;
    const c = Math.max(100, p + rnd);
    const o = p; const h = Math.max(o,c) + Math.random()*300; const l = Math.min(o,c) - Math.random()*300;
    out.push({ t, o, h, l, c, v: 1, T: t+60_000-1 });
    p = c;
  }
  return out;
}
