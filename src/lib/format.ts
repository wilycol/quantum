export const fmt = {
  money: (v: number) => (v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2 }),
  num: (v: number) => v.toLocaleString('en-US'),
  pct: (v: number) => (v * 100).toFixed(2) + '%',
};
