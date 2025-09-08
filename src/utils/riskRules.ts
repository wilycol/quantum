export function validateTPSL({ side, entry, tp, sl, atr, price }: {
  side: "long" | "short"; 
  entry: number; 
  tp: number; 
  sl: number; 
  atr?: number; 
  price?: number;
}) {
  if (!(entry > 0 && tp > 0 && sl > 0)) return { ok: false, error: "Valores inválidos" };
  
  const minPct = 0.001; // 0.10%
  const minDist = Math.max((price ?? entry) * minPct, (atr ?? 0) * 0.5);

  if (side === "long") {
    if (!(tp > entry && sl < entry)) return { ok: false, error: "Para long: TP>Entry y SL<Entry" };
    if ((tp - entry) < minDist) return { ok: false, error: "TP demasiado cerca" };
    if ((entry - sl) < minDist) return { ok: false, error: "SL demasiado cerca" };
    const rr = (tp - entry) / (entry - sl);
    if (rr < 1.5) return { ok: false, warn: "R:R < 1.5 (recomendado ≥ 1.5)" };
    return { ok: true, rr };
  } else {
    if (!(tp < entry && sl > entry)) return { ok: false, error: "Para short: TP<Entry y SL>Entry" };
    if ((entry - tp) < minDist) return { ok: false, error: "TP demasiado cerca" };
    if ((sl - entry) < minDist) return { ok: false, error: "SL demasiado cerca" };
    const rr = (entry - tp) / (sl - entry);
    if (rr < 1.5) return { ok: false, warn: "R:R < 1.5 (recomendado ≥ 1.5)" };
    return { ok: true, rr };
  }
}

export function calculateRR({ side, entry, tp, sl }: {
  side: "long" | "short";
  entry: number;
  tp: number;
  sl: number;
}): number {
  if (side === "long") {
    return (tp - entry) / (entry - sl);
  } else {
    return (entry - tp) / (sl - entry);
  }
}

export function getRRStatus(rr: number): { status: 'excellent' | 'good' | 'poor' | 'invalid'; color: string; label: string } {
  if (!Number.isFinite(rr) || rr <= 0) {
    return { status: 'invalid', color: 'text-gray-400', label: 'R:R inválido' };
  }
  if (rr >= 2.0) {
    return { status: 'excellent', color: 'text-emerald-400', label: `R:R ${rr.toFixed(1)}` };
  }
  if (rr >= 1.5) {
    return { status: 'good', color: 'text-blue-400', label: `R:R ${rr.toFixed(1)}` };
  }
  return { status: 'poor', color: 'text-amber-400', label: `R:R ${rr.toFixed(1)}` };
}
