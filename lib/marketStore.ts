import { create } from 'zustand';
import { subscribeKline, Unsub } from './binanceFeed';

type Candle = [number, number, number, number, number, number]; // ts, open, high, low, close, vol

type State = {
  symbol: string;
  interval: '1m'|'3m'|'5m'|'15m'|'30m'|'1h'|'2h'|'4h'|'1d';
  candles: Candle[];
  lastPrice?: number;
  binanceConnected: boolean;
  loading: boolean;
  error?: string;
  init: (symbol?: string, interval?: State['interval']) => Promise<void>;
  setSymbol: (s: string) => void;
};

let unsub: Unsub | null = null;

export const useMarket = create<State>((set, get) => ({
  symbol: 'BTCUSDT',
  interval: '1m',
  candles: [],
  binanceConnected: false,
  loading: true,

  async init(symbol = get().symbol, interval = get().interval) {
    // Backfill
    set({ loading: true, error: undefined, symbol, interval });
    const res = await fetch(`/api/klines?symbol=${symbol}&interval=${interval}&limit=500`, { cache: 'no-store' });
    if (!res.ok) {
      set({ loading: false, error: `klines ${res.status}` }); 
      return;
    }
    const rows = await res.json(); // Binance格式
    const candles: Candle[] = rows.map((r: any[]) => [r[0], +r[1], +r[2], +r[3], +r[4], +r[5]]);
    set({ candles, loading: false });

    // Feed en vivo
    if (unsub) unsub();
    unsub = subscribeKline(symbol, interval, (msg) => {
      // kline payload
      const k = msg.k;
      if (!k) return;
      const ts = k.t as number;
      const last = get().candles.at(-1);
      const updated: Candle = [ts, +k.o, +k.h, +k.l, +k.c, +k.v];
      const isClose = Boolean(k.x);
      set((s) => {
        let next = s.candles.slice();
        if (last && last[0] === ts) next[next.length - 1] = updated;
        else next = [...next, updated];
        return { candles: next, lastPrice: +k.c, binanceConnected: true };
      });
      if (isClose) {
        // aquí podrías emitir evento a IA Coach si quieres
      }
    });
  },

  setSymbol(s: string) {
    const interval = get().interval;
    get().init(s, interval);
  },
}));
