export const runtime = 'edge';

const BASE = process.env.BINANCE_BASE || 'https://api1.binance.com';

function okSym(s?: string) { return !!s && /^[A-Z0-9]{6,}$/.test(s); }
function okInt(i?: string) {
  return ['1m','3m','5m','15m','30m','1h','2h','4h','1d'].includes(String(i));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1m';
  const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 1000);

  if (!okSym(symbol) || !okInt(interval)) return new Response('Bad params', { status: 400 });

  const url = `${BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  console.log('[KLINES API] Fetching from:', url);
  const r = await fetch(url, { cache: 'no-store' });
  console.log('[KLINES API] Response status:', r.status);
  if (!r.ok) return new Response(`Upstream ${r.status}`, { status: r.status });
  const data = await r.json();
  console.log('[KLINES API] Data received:', { isArray: Array.isArray(data), length: data?.length, type: typeof data });
  return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
}
