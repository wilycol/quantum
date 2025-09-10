import { create } from 'zustand';

export type BusEvent =
  | { type:'ws/connected'; t:number }
  | { type:'ws/disconnected'; t:number }
  | { type:'market/kline'; symbol:string; interval:string; k:any; t:number }
  | { type:'signal/preview'; pair:string; side:'BUY'|'SELL'; t:number }
  | { type:'order/accepted'; id:string; symbol:string; side:'BUY'|'SELL'; price?:number; amountUsd?:number; t:number }
  | { type:'order/filled'; id:string; symbol:string; side:'BUY'|'SELL'; price:number; qty:number; pnl:number; t:number }
  | { type:'risk/error'; code:string; detail:string; t:number }
  | { type:'system/info'; msg:string; t:number }
  | { type:'system/warn'; msg:string; t:number }
  | { type:'system/error'; msg:string; t:number };

export type LogRow = { t:number; level:'info'|'warn'|'error'; tag:string; msg:string; data?:any };
export type TradeRow = {
  id:string; t:number; symbol:string; side:'BUY'|'SELL';
  price?:number; qty?:number; pnl?:number; status:'preview'|'accepted'|'filled'|'rejected';
};

type State = {
  wsConnected: boolean;
  logs: LogRow[];
  trades: TradeRow[];
  addLog: (row: LogRow) => void;
  upsertTrade: (row: TradeRow) => void;
  clear: () => void;
  emit: (e: BusEvent) => void;
};

const LIMIT = 500;            // tope circular
const clamp = <T>(arr:T[]) => (arr.length>LIMIT ? arr.slice(arr.length-LIMIT) : arr);

export const useEventBus = create<State>((set, get) => ({
  wsConnected: false,
  logs: [],
  trades: [],
  addLog: (row) => set(s => ({ logs: clamp([...s.logs, row]) })),
  upsertTrade: (row) => set(s => {
    const i = s.trades.findIndex(t => t.id === row.id);
    const next = i>=0 ? [...s.trades.slice(0,i), {...s.trades[i], ...row}, ...s.trades.slice(i+1)]
                      : [...s.trades, row];
    return { trades: clamp(next) };
  }),
  clear: () => set({ logs: [], trades: [] }),
  emit: (e) => {
    const add = get().addLog, put = get().upsertTrade;
    const now = Date.now();
    switch (e.type) {
      case 'ws/connected':  set({ wsConnected:true });  add({ t:now, level:'info', tag:'WS', msg:'Connected' }); break;
      case 'ws/disconnected': set({ wsConnected:false }); add({ t:now, level:'warn', tag:'WS', msg:'Disconnected' }); break;

      case 'market/kline': add({ t:e.t, level:'info', tag:'MARKET', msg:`${e.symbol}@${e.interval}`, data:e.k }); break;

      case 'signal/preview':
        put({ id:`prev-${e.t}`, t:e.t, symbol:e.pair, side:e.side, status:'preview' });
        add({ t:e.t, level:'info', tag:'SIGNAL', msg:'Preview received', data:e });
        break;

      case 'order/accepted':
        put({ id:e.id, t:e.t, symbol:e.symbol, side:e.side, price:e.price, status:'accepted' });
        add({ t:e.t, level:'info', tag:'ORDER', msg:'Order accepted', data:e });
        break;

      case 'order/filled':
        put({ id:e.id, t:e.t, symbol:e.symbol, side:e.side, price:e.price, qty:e.qty, pnl:e.pnl, status:'filled' });
        add({ t:e.t, level:'info', tag:'FILL', msg:`Filled ${e.symbol}`, data:e });
        break;

      case 'risk/error':
        add({ t:e.t, level:'error', tag:`RISK:${e.code}`, msg:e.detail });
        break;

      case 'system/info':  add({ t:now, level:'info',  tag:'SYS', msg:e.msg }); break;
      case 'system/warn':  add({ t:now, level:'warn',  tag:'SYS', msg:e.msg }); break;
      case 'system/error': add({ t:now, level:'error', tag:'SYS', msg:e.msg }); break;
    }
  },
}));
