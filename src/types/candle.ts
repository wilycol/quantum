// src/types/candle.ts
export type Candle = {
  t: number; // openTime (ms)
  o: number; h: number; l: number; c: number;
  v: number; T: number; // closeTime (ms)
};

export function mapBinanceKlines(arr: any[]): Candle[] {
  // Binance kline: [openTime, open, high, low, close, volume, closeTime, ...]
  return arr.map((k) => ({
    t: Number(k[0]),
    o: Number(k[1]),
    h: Number(k[2]),
    l: Number(k[3]),
    c: Number(k[4]),
    v: Number(k[5]),
    T: Number(k[6]),
  }));
}
