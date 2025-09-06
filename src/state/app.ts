// src/state/app.ts
export type AppMode = 'demo-full' | 'demo-hybrid' | 'live-trading'; 
// demo-full: feed mock + paper
// demo-hybrid: feed live + paper
// live-trading: feed live + órdenes reales (testnet en preview, paper seguro en prod)

const KEY = 'qt.app.mode.v1';

export function loadMode(): AppMode {
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'demo-full' || s === 'demo-hybrid' || s === 'live-trading') return s;
  } catch {}
  return 'demo-hybrid';
}
export function saveMode(m: AppMode) {
  localStorage.setItem(KEY, m);
}
