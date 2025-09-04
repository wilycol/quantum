// Portfolio
export const MOCK_PORTFOLIO_ASSETS = [
  { symbol: "BTC", amount: 0.25, price: 60000 },
  { symbol: "ETH", amount: 1.2, price: 2500 },
  { symbol: "SOL", amount: 10, price: 150 },
];
export const MOCK_REAL_PORTFOLIO_ASSETS = MOCK_PORTFOLIO_ASSETS;

export const MOCK_PORTFOLIO_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  date: `2025-08-${String(i + 1).padStart(2, "0")}`,
  equity: 10000 + i * 120 - (i % 5 === 0 ? 300 : 0),
}));
export const MOCK_PORTFOLIO_EVOLUTION = MOCK_PORTFOLIO_HISTORY.map((d, i) => ({
  date: d.date,
  pnl: Math.round((Math.sin(i / 5) * 200 + (i - 15) * 8) * 100) / 100,
}));

// Prices / candles / positions
export const MOCK_CANDLESTICK_DATA = Array.from({ length: 120 }, (_, i) => {
  const base = 58000 + Math.sin(i / 7) * 800 + (i - 60) * 3;
  const o = base + (Math.random() - 0.5) * 60;
  const c = base + (Math.random() - 0.5) * 60;
  const h = Math.max(o, c) + Math.random() * 80;
  const l = Math.min(o, c) - Math.random() * 80;
  return { time: i, open: o, high: h, low: l, close: c, volume: 20 + Math.random() * 10 };
});
export const MOCK_POSITIONS = [
  { symbol: "BTC/USDT", side: "long", qty: 0.01, avgPrice: 59000, pnl: 12.5 },
  { symbol: "ETH/USDT", side: "short", qty: 0.2, avgPrice: 2600, pnl: -4.2 },
];

// Wallet / desk / AI
export const MOCK_WALLET_DATA = { balance: 10000, available: 9800, marginUsed: 200 };
export const MOCK_AI_DECISIONS = [
  { ts: Date.now() - 60000, action: "observe", reason: "Low volume" },
  { ts: Date.now() - 30000, action: "suggest-buy", reason: "RSI<30" },
];

// News / market
export const MOCK_MARKET_PRICES = [
  { symbol: "BTC", price: 60234 }, { symbol: "ETH", price: 2510 }, { symbol: "SOL", price: 152 }
];
export const MOCK_NEWS_ARTICLES = [
  { id: 1, title: "BTC holds key level", source: "Quantum News", url: "#" },
  { id: 2, title: "ETH upgrades staking", source: "Quantum News", url: "#" },
];

// Notifications / FAQs
export const MOCK_FAQS = [
  { q: "How to start paper trading?", a: "Enable PAPER=1 in settings." },
  { q: "How to switch mode?", a: "Change MODE to demo|hybrid|live." },
];

// History (manual/AI)
export const MOCK_MANUAL_TRADES = [
  { id: "m1", time: Date.now() - 7200000, symbol: "BTC/USDT", side: "BUY", qty: 0.005, price: 59800, fee: 0.1, pnl: 5.4 },
];
export const MOCK_AI_TRADES = [
  { id: "a1", time: Date.now() - 3600000, symbol: "ETH/USDT", side: "SELL", qty: 0.1, price: 2550, fee: 0.1, pnl: -2.1 },
];
export const MOCK_AI_INTERACTIONS = [
  { id: "x1", time: Date.now() - 120000, prompt: "Trend now?", response: "Sideways; wait for breakout." },
];

// Defaults de configuración
export const DEFAULT_USER_RISK_CONFIG = {
  maxDailyLossPct: 2,
  maxPositionPct: 20,
  leverage: 1,
  slippageBps: 5,
};

export const DEFAULT_AI_STRATEGY_CONFIG = {
  rsiPeriod: 14,
  rsiBuy: 30,
  rsiSell: 70,
  takeProfitPct: 0.8,
  stopLossPct: 0.6,
};
