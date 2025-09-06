// src/services/api.ts
export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(path, { method: 'GET' });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || `GET ${path} failed`);
  return j as T;
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `POST ${path} failed`);
  return j as T;
}

// BINANCE helpers
export type PlaceOrderPayload = {
  symbol: string;
  side: 'BUY'|'SELL';
  type: 'MARKET'|'LIMIT';
  quantity?: number;
  quoteOrderQty?: number;
  price?: number;
  timeInForce?: 'GTC'|'IOC'|'FOK';
  test?: boolean;
};

export async function getBalances() {
  return apiGet<{ ok: boolean; data: any[] }>('/api/binance/balances');
}

export async function placeOrderBinance(payload: PlaceOrderPayload) {
  return apiPost<{ ok: boolean; data: any }>('/api/binance/order', payload);
}
