import { useCallback, useMemo, useState } from 'react';
import { load, save, placeOrder, markToMarket, PaperState, Side } from '../engine/paper';

export function usePaper(lastPrice: number) {
  const [state, setState] = useState<PaperState>(() => load());
  
  const unrealized = useMemo(() => markToMarket(state, lastPrice), [state, lastPrice]);
  
  const equity = useMemo(() => 
    state.cash + unrealized + (state.pos ? state.pos.avg * state.pos.qty : 0), 
    [state, unrealized]
  );
  
  const submit = useCallback((side: Side, qty: number) => {
    const o = { 
      id: crypto.randomUUID(), 
      ts: Date.now(), 
      side, 
      qty, 
      price: lastPrice 
    };
    const next = placeOrder(state, o);
    setState(next);
  }, [state, lastPrice]);
  
  const reset = useCallback(() => {
    const blank: PaperState = { cash: 10000, pos: undefined, trades: [] };
    save(blank);
    setState(blank);
  }, []);
  
  return { state, unrealized, equity, submit, reset };
}
