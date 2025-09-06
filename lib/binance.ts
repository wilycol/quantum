// lib/binance.ts
import crypto from 'crypto';

// BASE: testnet por defecto; en prod podrás cambiar a mainnet si quieres.
const BASE = process.env.BINANCE_SPOT_TESTNET_BASE || 'https://testnet.binance.vision';

// Keys
const API_KEY = process.env.BINANCE_API_KEY || '';
const API_SECRET = (process.env.BINANCE_API_SECRET || '').trim();

// Validaciones tempranas
if (!API_KEY || !API_SECRET) {
  console.warn('[binance] WARNING: faltan API_KEY/SECRET en este environment');
}

// --- Control de tiempo (para evitar -1021) ---
let timeOffsetMs = 0;       // serverTime - localTime
let lastSync = 0;

async function syncServerTime() {
  const url = `${BASE}/api/v3/time`;
  const t0 = Date.now();
  const r = await fetch(url, { cache: 'no-store' });
  const txt = await r.text();
  if (!r.ok) throw new Error(`time sync failed: ${r.status} ${txt}`);
  const data = JSON.parse(txt) as { serverTime: number };
  const t1 = Date.now();
  // Aproximamos offset al centro del RTT
  const local = Math.round((t0 + t1) / 2);
  timeOffsetMs = data.serverTime - local;
  lastSync = Date.now();
  console.log('[binance] time synced. offset(ms)=', timeOffsetMs);
}

async function ensureTime() {
  if (Date.now() - lastSync > 60_000) { // resync cada 60s
    try { await syncServerTime(); } catch (e) { console.warn('[binance] time sync error:', (e as any)?.message); }
  }
}

function sign(query: string) {
  return crypto.createHmac('sha256', API_SECRET).update(query).digest('hex');
}

function encode(params: Record<string, any>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.set(k, String(v));
  });
  return usp.toString();
}

async function signedFetch(
  method: 'GET'|'POST'|'DELETE',
  path: string,
  params: Record<string, any> = {},
) {
  await ensureTime();
  const recvWindow = params.recvWindow ?? 5000;
  const timestamp = (Date.now() + timeOffsetMs);
  const baseParams = { ...params, recvWindow, timestamp };

  const qs = encode(baseParams);
  const sig = sign(qs);

  const url = `${BASE}${path}?${qs}&signature=${sig}`;

  const r = await fetch(url, {
    method,
    headers: { 'X-MBX-APIKEY': API_KEY },
  });

  const text = await r.text();
  if (!r.ok) {
    // Intenta parsear error de binance: { code: -1021, msg: 'Timestamp...' }
    let err: any = text;
    try { err = JSON.parse(text); } catch {}
    throw new Error(`binance ${method} ${path} ${r.status} ${typeof err==='string'?err:JSON.stringify(err)}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

// --- APIs públicas útiles para debug ---
export async function ping() {
  const url = `${BASE}/api/v3/ping`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`ping failed ${r.status}`);
  return true;
}
export async function serverTime() {
  await syncServerTime();
  return { offsetMs: timeOffsetMs, lastSync };
}

// --- Spot Account ---
export type SpotOrderReq = {
  symbol: string;
  side: 'BUY'|'SELL';
  type: 'MARKET'|'LIMIT';
  quantity?: number;
  quoteOrderQty?: number;
  price?: number;
  timeInForce?: 'GTC'|'IOC'|'FOK';
  test?: boolean;
};

export async function getSpotBalances() {
  const data = await signedFetch('GET', '/api/v3/account', {});
  // filtra balances > 0
  const balances = (data.balances || []).filter((b: any) => +b.free > 0 || +b.locked > 0);
  return balances;
}

export async function placeSpotOrder(req: SpotOrderReq) {
  const path = req.test ? '/api/v3/order/test' : '/api/v3/order';
  // Para POST, Binance también acepta la firma en querystring; dejamos body vacío.
  const params: Record<string, any> = {
    symbol: req.symbol,
    side: req.side,
    type: req.type,
    timeInForce: req.timeInForce,
    quantity: req.quantity,
    quoteOrderQty: req.quoteOrderQty,
    price: req.price,
  };
  return signedFetch('POST', path, params);
}