import { create } from 'zustand';
import { subscribeKline, Unsub } from './binanceFeed';
import { useEventBus } from './eventBus';

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
           console.log('[MARKET STORE] init() called with:', { symbol, interval });
           // Backfill
           set({ loading: true, error: undefined, symbol, interval });
           console.log('[MARKET STORE] About to fetch klines...');
    const timestamp = Date.now();
    const res = await fetch(`/api/klines?symbol=${symbol}&interval=${interval}&limit=500&t=${timestamp}`, { cache: 'no-store' });
    console.log('[MARKET STORE] Fetch response:', { ok: res.ok, status: res.status });
    if (!res.ok) {
      set({ loading: false, error: `klines ${res.status}` }); 
      return;
    }
    const response = await res.json(); // Puede ser {ok: true, data: [...]} o [...]
    console.log('[MARKET STORE] JSON response:', { isArray: Array.isArray(response), length: response?.length, hasData: !!response?.data });
    
    // Manejar ambos formatos: {ok: true, data: [...]} o [...]
    const rows = response?.data || response;
    console.log('[MARKET STORE] Processed rows:', { isArray: Array.isArray(rows), length: rows?.length });
    
    if (!Array.isArray(rows)) {
      set({ loading: false, error: 'Invalid response format' });
      return;
    }
    const candles: Candle[] = rows.map((r: any[]) => [r[0], +r[1], +r[2], +r[3], +r[4], +r[5]]);
    const last = candles.at(-1);
    console.log('[MARKET STORE] Processed candles:', { count: candles.length, first: candles[0], last: candles[candles.length - 1] });
    console.log('[MARKET STORE] About to set candles in store...');
    set({ candles, loading: false, lastPrice: last ? last[4] : undefined });
    console.log('[MARKET STORE] Candles set in store successfully');

    // Feed en vivo
    console.log('[MARKET STORE] Starting live feed for:', symbol, interval);
    console.log('[MARKET STORE] About to call subscribeKline...');
    if (unsub) unsub();
    
    // WebSocket feed (separate from candle processing)
    try {
      unsub = subscribeKline(symbol, interval, (msg) => {
      console.log('[MARKET STORE] Received live data:', msg);
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
      
      // Emit to EventBus
      const emit = useEventBus.getState().emit;
      emit({ 
        type: 'market/kline', 
        symbol: symbol.toUpperCase(), 
        interval, 
        k: msg.k, 
        t: msg.E || Date.now() 
      });
      
      if (isClose) {
        console.log('[MARKET STORE] Candle closed, price:', +k.c);
        // aquí podrías emitir evento a IA Coach si quieres
      }
    });

    // Fallback amable: si en 8s no hay WS, hacer poll suave cada 2s
    setTimeout(() => {
      if (!get().binanceConnected) {
        const poll = setInterval(() => {
          if (get().binanceConnected) {
            clearInterval(poll);
            return;
          }
          // Poll suave cada 2s hasta que llegue el primer tick
          fetch(`/api/klines?symbol=${symbol}&interval=${interval}&limit=1`, { cache: 'no-store' })
            .then(r => r.json())
            .then(rows => {
              if (Array.isArray(rows) && rows[0]) {
                const latest: Candle = [rows[0][0], +rows[0][1], +rows[0][2], +rows[0][3], +rows[0][4], +rows[0][5]];
                set(s => ({ ...s, lastPrice: latest[4] }));
              }
            })
            .catch(() => {});
        }, 2000);
      }
    }, 8000);
           } catch (error) {
             console.error('[MARKET STORE] Error in subscribeKline:', error);
             set({ error: `WebSocket error: ${error}` });
           }
         },

  setSymbol(s: string) {
    const interval = get().interval;
    get().init(s, interval);
  },
}));
