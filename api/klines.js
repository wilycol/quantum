// /api/klines  -> proxy a Binance en Edge Runtime (rápido y sin CORS)
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const symbol   = searchParams.get('symbol')   ?? 'BTCUSDT';
  const interval = searchParams.get('interval') ?? '1m';
  const limit    = searchParams.get('limit')    ?? '200';

  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const r = await fetch(url);
  if (!r.ok) {
    return new Response(JSON.stringify({ error: `Binance ${r.status}` }), {
      status: r.status,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
    });
  }
  const arr = await r.json();
  const out = arr.map(k => ({ t:k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5] }));
  return new Response(JSON.stringify(out), {
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
  });
}
