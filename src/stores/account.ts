import { create } from "zustand";

type Position = {
  symbol: string;
  qty: number;       // >0 long, <0 short (si lo habilitas luego)
  avg: number;       // precio promedio
  sl?: number | null; // stop loss
  tp?: number | null; // take profit
};

type AccountState = {
  equity: number;
  cash: number;
  pos: Position | null;
  unrealized: number;  // PnL no realizado (USD)
  setEquityCash: (equity: number, cash: number) => void;
  onTick: (lastPrice: number) => void;
  onOrder: (side: "buy"|"sell", symbol: string, price: number, qty: number, sl?: number, tp?: number) => void;
  resetPaper: () => void;
};

export const useAccountStore = create<AccountState>((set, get) => ({
  equity: 10000,
  cash: 10000,
  pos: null,
  unrealized: 0,

  setEquityCash: (equity, cash) => set({ equity, cash }),

  onTick: (last) => {
    const { pos } = get();
    if (!pos || !last || !isFinite(last)) return set({ unrealized: 0 });
    
    // PnL
    const pnl = (last - pos.avg) * pos.qty; // qty>0 long
    set({ unrealized: pnl });

    // Auto close por SL/TP
    if (pos.qty > 0) { // long
      if (pos.sl && last <= pos.sl) return closeNow("SL");
      if (pos.tp && last >= pos.tp) return closeNow("TP");
    } else { // short
      if (pos.sl && last >= pos.sl) return closeNow("SL");
      if (pos.tp && last <= pos.tp) return closeNow("TP");
    }

    function closeNow(reason: "SL" | "TP") {
      // genera orden contraria por la qty total
      const side = pos.qty > 0 ? "sell" : "buy";
      const qty = Math.abs(pos.qty);
      window.dispatchEvent(new CustomEvent("qt:order", { 
        detail: { side, symbol: pos.symbol, price: last, qty, reason } 
      }));
    }
  },

  onOrder: (side, symbol, price, qty, sl, tp) => {
    const s = get();
    
    // Validar parámetros
    if (!price || !isFinite(price) || !qty || !isFinite(qty) || !symbol) {
      console.error('Invalid order parameters:', { side, symbol, price, qty });
      return;
    }
    
    const sign = side === "buy" ? 1 : -1;
    const deltaQty = sign * qty;

    let pos = s.pos;
    let cash = s.cash - (price * deltaQty); // comprar disminuye cash, vender aumenta
    if (!pos || pos.symbol !== symbol || pos.qty === 0) {
      pos = { symbol, qty: deltaQty, avg: price, sl: sl || null, tp: tp || null };
    } else {
      const newQty = pos.qty + deltaQty;
      if (Math.sign(pos.qty) === Math.sign(newQty) && newQty !== 0) {
        // mismo lado -> average price
        const notional = pos.avg * Math.abs(pos.qty) + price * Math.abs(deltaQty);
        pos.avg = notional / Math.abs(newQty);
        pos.qty = newQty;
      } else if (newQty === 0) {
        // cerró posición
        pos.qty = 0; pos.avg = price;
      } else {
        // reducción o flip; para simpleza, ajusta qty y deja avg
        pos.qty = newQty;
      }
    }

    set({ cash, pos });
  },

  resetPaper: () => set({ equity: 10000, cash: 10000, pos: null, unrealized: 0 }),
}));

// Helper para escuchar el evento global de órdenes en tu App root:
export function bindOrderEvents() {
  const onOrder = (e: Event) => {
    const { side, symbol, price, qty } = (e as CustomEvent).detail;
    useAccountStore.getState().onOrder(side, symbol, price, qty);
  };
  window.addEventListener("qt:order", onOrder as EventListener, { passive: true });
  return () => window.removeEventListener("qt:order", onOrder as EventListener);
}
