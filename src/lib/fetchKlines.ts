export type Candle = { t:number; o:number; h:number; l:number; c:number; v:number };

export async function fetchKlines(symbol:string, interval:string, limit=500): Promise<Candle[]> {
  const q = new URLSearchParams({ symbol, interval, limit: String(limit) });
  const res = await fetch(`/api/klines?${q.toString()}`, { cache: 'no-store' });
  console.info('[DATA FETCH] /api/klines', '• host:', res.headers.get('x-qt-host') || res.headers.get('x-data-host') || '', '• status:', res.status);
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error || `klines ${res.status}`);
  const arr = Array.isArray(j) ? j : (j?.data ?? []);
  return (arr as any[]).map(d => ({
    t: Number(d[0]), o:+d[1], h:+d[2], l:+d[3], c:+d[4], v:+d[5]
  }));
}

export function genSimCandles(n=500): Candle[] {
  const out:Candle[] = []; let p = 100;
  for (let i=0;i<n;i++){
    const o = p, c = o + (Math.random()-0.5)*2;
    const h = Math.max(o,c)+Math.random()*0.8, l = Math.min(o,c)-Math.random()*0.8;
    out.push({ t: Date.now()-(n-i)*60_000, o:+o.toFixed(2), h:+h.toFixed(2), l:+l.toFixed(2), c:+c.toFixed(2), v:+(10+Math.random()*5).toFixed(2) as any });
    p = c;
  }
  return out;
}
