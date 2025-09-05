// Tipos
export type Side = 'BUY' | 'SELL';
export type Order = { id: string; ts: number; side: Side; qty: number; price: number };
export type Position = { side: Side; qty: number; avg: number }; // promedio ponderado
export type Trade = { id: string; ts: number; side: Side; qty: number; price: number; fee: number; pnl: number };
export type PaperState = { cash: number; pos?: Position; trades: Trade[] };

// Helpers
const KEY = 'qt.paper.v1';
const FEE_RATE = 0.001; // 0.1%

export function load(): PaperState {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '') as PaperState;
  } catch {
    return { cash: 10000, pos: undefined, trades: [] };
  }
}

export function save(s: PaperState) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function placeOrder(s: PaperState, o: Order): PaperState {
  const fee = o.price * o.qty * FEE_RATE;
  let next = { ...s, trades: [...s.trades] } as PaperState;

  // abrir/añadir posición
  if (!next.pos) {
    next.pos = { side: o.side, qty: o.qty, avg: o.price };
  } else if (next.pos.side === o.side) {
    // mismo lado → promedia
    const totalCost = next.pos.avg * next.pos.qty + o.price * o.qty;
    const totalQty = next.pos.qty + o.qty;
    next.pos = { side: o.side, qty: totalQty, avg: totalCost / totalQty };
  } else {
    // lado contrario → reduce/cierra y calcula pnl realizado
    const closeQty = Math.min(next.pos.qty, o.qty);
    const openSign = next.pos.side === 'BUY' ? 1 : -1;
    const pnl = openSign * (o.price - next.pos.avg) * closeQty - fee;
    
    next.trades.push({
      id: o.id,
      ts: o.ts,
      side: o.side,
      qty: closeQty,
      price: o.price,
      fee,
      pnl
    });

    const remain = next.pos.qty - closeQty;
    if (remain > 0) {
      next.pos = { ...next.pos, qty: remain };
    } else {
      next.pos = undefined;
    }

    // ¿quedó excedente en la nueva dirección? abre nueva pos con el sobrante
    const extra = o.qty - closeQty;
    if (extra > 0) next.pos = { side: o.side, qty: extra, avg: o.price };
  }

  // cash (simple: BUY resta, SELL suma)
  next.cash += (o.side === 'SELL' ? +1 : -1) * (o.price * o.qty) - fee;
  save(next);
  return next;
}

export function markToMarket(s: PaperState, last: number): number {
  if (!s.pos) return 0;
  const sign = s.pos.side === 'BUY' ? 1 : -1;
  return sign * (last - s.pos.avg) * s.pos.qty;
}
