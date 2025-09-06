// lib/binance.ts
import crypto from 'crypto';

const SPOT = process.env.BINANCE_SPOT_TESTNET_BASE || 'https://testnet.binance.vision';
const API_KEY = process.env.BINANCE_API_KEY || '';
const API_SECRET = process.env.BINANCE_API_SECRET || '';

if (!SPOT.startsWith('https://')) {
  throw new Error('BINANCE_SPOT_TESTNET_BASE inválida');
}

function qs(params: Record<string, any>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

function sign(query: string) {
  return crypto.createHmac('sha256', API_SECRET).update(query).digest('hex');
}

export async function serverTime(): Promise<number> {
  const r = await fetch(`${SPOT}/api/v3/time`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`serverTime ${r.status}`);
  const j = await r.json();
  return j.serverTime as number;
}

export async function signedFetch(
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  params: Record<string, any> = {}
) {
  if (!API_KEY || !API_SECRET) throw new Error('BINANCE_API_KEY/SECRET no configurados');
  const srv = await serverTime();
  const queryObj = { recvWindow: 5000, timestamp: srv, ...params };
  const query = qs(queryObj);
  const signature = sign(query);
  const endpoint = `${SPOT}${path}?${query}&signature=${signature}`;
  const headers = { 'X-MBX-APIKEY': API_KEY };

  const r = await fetch(endpoint, { method, headers });
  const text = await r.text();
  let data: any; try { data = JSON.parse(text); } catch { data = text; }

  // Reintento de drift -1021
  if (!r.ok && data?.code === -1021) {
    const srv2 = await serverTime();
    const q2 = qs({ recvWindow: 10000, timestamp: srv2, ...params });
    const s2 = sign(q2);
    const ep2 = `${SPOT}${path}?${q2}&signature=${s2}`;
    const r2 = await fetch(ep2, { method, headers });
    const d2 = await r2.json().catch(() => ({}));
    if (!r2.ok) throw new Error(`Binance err ${r2.status} ${JSON.stringify(d2)}`);
    return d2;
  }

  if (!r.ok) throw new Error(`Binance err ${r.status} ${JSON.stringify(data)}`);
  return data;
}

export async function getSpotAccount() {
  return signedFetch('/api/v3/account', 'GET');
}

export async function getSpotBalances() {
  const acc = await getSpotAccount();
  return acc.balances as Array<{ asset: string; free: string; locked: string }>;
}

export type SpotOrderReq = {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity?: number;
  quoteOrderQty?: number;
  price?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  test?: boolean;
};

export async function placeSpotOrder(req: SpotOrderReq) {
  const path = req.test ? '/api/v3/order/test' : '/api/v3/order';
  const params = {
    symbol: req.symbol,
    side: req.side,
    type: req.type,
    quantity: req.quantity,
    quoteOrderQty: req.quoteOrderQty,
    price: req.price,
    timeInForce: req.type === 'LIMIT' ? (req.timeInForce || 'GTC') : undefined,
    newOrderRespType: 'RESULT',
  };
  return signedFetch(path, 'POST', params);
}
