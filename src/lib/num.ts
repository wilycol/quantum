export function toNum(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export function fmt(n: unknown, d = 6): string {
  const x = toNum(n, NaN);
  return Number.isFinite(x) ? x.toFixed(d) : "—";
}
