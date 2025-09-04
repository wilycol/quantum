// /api/klines  -> proxy a Binance (evita CORS)
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { symbol = 'BTCUSDT', interval = '1m', limit = '200' } = req.query || {};
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: `Binance ${r.status}` });
    const arr = await r.json() as any[];
    const out = arr.map(k => ({ t:k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5] }));
    res.status(200).json(out);
  } catch (e:any) {
    res.status(500).json({ error: e?.message || 'proxy-failed' });
  }
}