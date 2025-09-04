// Tipos para datos de velas
export interface Candle {
  t: number;    // timestamp
  o: number;    // open
  h: number;    // high
  l: number;    // low
  c: number;    // close
  v: number;    // volume
}

// Mapeo de timeframes a intervalos de Binance
const TF_TO_BINANCE: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

// Función para obtener datos de Binance a través de nuestro proxy
export async function fetchBinanceKlines(symbol: string, timeframe: string, limit = 200): Promise<Candle[]> {
  const interval = TF_TO_BINANCE[timeframe] ?? '1m';
  
  // usar nuestro proxy (no llamar directo a api.binance)
  const res = await fetch(`/api/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  if (!res.ok) throw new Error(`Proxy ${res.status}`);
  const arr = await res.json() as any[];
  return arr.map(k => ({ t:k.t, o:+k.o, h:+k.h, l:+k.l, c:+k.c, v:+k.v }));
}

// Función mock para datos de prueba (fallback)
export function generateMockCandles(symbol: string, timeframe: string, limit = 200): Candle[] {
  const now = Date.now();
  const intervalMs = getIntervalMs(timeframe);
  const candles: Candle[] = [];
  
  // Precio base según el símbolo
  const basePrice = getBasePrice(symbol);
  
  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02; // ±1% variación
    const open = price;
    const close = price + (Math.random() - 0.5) * basePrice * 0.01;
    const high = Math.max(open, close) + Math.random() * basePrice * 0.005;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.005;
    const volume = 1000 + Math.random() * 5000;
    
    candles.push({
      t: timestamp,
      o: open,
      h: high,
      l: low,
      c: close,
      v: volume
    });
  }
  
  return candles;
}

// Función auxiliar para obtener el intervalo en milisegundos
function getIntervalMs(timeframe: string): number {
  const intervals: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return intervals[timeframe] || intervals['1m'];
}

// Función auxiliar para obtener precio base según símbolo
function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'BTCUSDT': 45000,
    'ETHUSDT': 3000,
    'ADAUSDT': 0.5,
    'SOLUSDT': 100,
    'DOTUSDT': 7,
    'LINKUSDT': 15,
  };
  return prices[symbol] || 100;
}
