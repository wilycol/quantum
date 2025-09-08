import { useCallback, useMemo, useState } from 'react';
import { load, save, placeOrder, markToMarket, PaperState, Side } from '../engine/paper';

export function usePaper(lastPrice: number) {
  const [state, setState] = useState<PaperState>(() => load());
  
  // Validar lastPrice
  const safeLastPrice = lastPrice && isFinite(lastPrice) ? lastPrice : 0;
  
  const unrealized = useMemo(() => markToMarket(state, safeLastPrice), [state, safeLastPrice]);
  
  const equity = useMemo(() => {
    // El equity debe ser el valor total de la cuenta, no solo el cash
    // Si hay posición, el equity es: cash + valor actual de la posición
    const positionValue = state.pos ? state.pos.qty * safeLastPrice : 0;
    const calculatedEquity = Math.max(0, state.cash + positionValue + unrealized);
    
    console.log('[usePaper] Equity calculation:', {
      cash: state.cash,
      positionValue,
      unrealized,
      calculatedEquity,
      position: state.pos
    });
    
    return calculatedEquity;
  }, [state, safeLastPrice, unrealized]);
  
  const submit = useCallback((side: Side, qty: number) => {
    if (!safeLastPrice || safeLastPrice <= 0) {
      console.error('Invalid lastPrice for paper order:', safeLastPrice);
      return;
    }
    
    const o = { 
      id: crypto.randomUUID(), 
      ts: Date.now(), 
      side, 
      qty, 
      price: safeLastPrice 
    };
    const next = placeOrder(state, o);
    setState(next);
  }, [state, safeLastPrice]);
  
  const reset = useCallback(() => {
    const blank: PaperState = { cash: 10000, pos: undefined, trades: [] };
    save(blank);
    setState(blank);
  }, []);
  
  return { state, unrealized, equity, submit, reset };
}
