export function ensureArray<T>(v: T[] | undefined | null): T[] {
  return Array.isArray(v) ? v : [];
}

export function toNumber(v: any, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export function num(x: any, d = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
}

export function hasAllKeys(obj: any, keys: string[]) {
  return keys.every(k => obj != null && Object.hasOwn(obj, k));
}

export function onlyFinite(obj: Record<string, any>, keys: string[]) {
  return keys.every(k => Number.isFinite(Number(obj[k])));
}
