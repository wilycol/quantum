import { create } from "zustand";

type Position = {
  symbol: string;
  qty: number;       // >0 long, <0 short (si lo habilitas luego)
  avg: number;       // precio promedio
};

type AccountState = {
  equity: number;
  cash: number;
  pos: Position | null;
  unrealized: number;  // PnL no realizado (USD)
  setEquityCash: (equity: number, cash: number) => void;
  onTick: (lastPrice: number) => void;
  onOrder: (side: "buy"|"sell", symbol: string, price: number, qty: number) => void;
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
    if (!pos) return set({ unrealized: 0 });
    const pnl = (last - pos.avg) * pos.qty; // qty>0 long
    set({ unrealized: pnl });
  },

  onOrder: (side, symbol, price, qty) => {
    const s = get();
    const sign = side === "buy" ? 1 : -1;
    const deltaQty = sign * qty;

    let pos = s.pos;
    let cash = s.cash - (price * deltaQty); // comprar disminuye cash, vender aumenta
    if (!pos || pos.symbol !== symbol || pos.qty === 0) {
      pos = { symbol, qty: deltaQty, avg: price };
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
