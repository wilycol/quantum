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
  return { time: new Date(Date.now() - (120 - i) * 60000).toISOString(), open: o, high: h, low: l, close: c, volume: 20 + Math.random() * 10 };
});
export const MOCK_POSITIONS = [
  { symbol: "BTC/USDT", instrument: "BTC/USDT", side: "long", qty: 0.01, avgPrice: 59000, pnl: 12.5 },
  { symbol: "ETH/USDT", instrument: "ETH/USDT", side: "short", qty: 0.2, avgPrice: 2600, pnl: -4.2 },
];

// Wallet / desk / AI
export const MOCK_WALLET_DATA = { balance: 10000, available: 9800, marginUsed: 200 };
export const MOCK_AI_DECISIONS = [
  { id: 'd1', timestamp: Date.now() - 60000, decision: 'EXECUTE_BUY', asset: 'BTC/USDT', confidence: 72, reason: 'RSI<30' },
  { id: 'd2', timestamp: Date.now() - 30000, decision: 'OBSERVE', asset: 'ETH/USDT', confidence: 45, reason: 'Low volume' },
];

// News / market
export const MOCK_MARKET_PRICES = [
  { id: 1, symbol: "BTC", price: 60234, icon: "₿", name: "Bitcoin", source: "CoinGecko", change24h: 2.5 },
  { id: 2, symbol: "ETH", price: 2510, icon: "Ξ", name: "Ethereum", source: "CoinGecko", change24h: -1.2 },
  { id: 3, symbol: "SOL", price: 152, icon: "◎", name: "Solana", source: "CoinGecko", change24h: 5.8 }
];
export const MOCK_NEWS_ARTICLES = [
  { id: 1, title: "BTC holds key level", source: "Quantum News", url: "#", impact: "High", category: "Bitcoin", summary: "BTC se mantiene sobre soporte clave..." },
  { id: 2, title: "ETH upgrades staking", source: "Quantum News", url: "#", impact: "Medium", category: "Ethereum", summary: "Ethereum mejora su sistema de staking..." },
];

// Notifications / FAQs
export const MOCK_FAQS = [
  { q: "How to start paper trading?", a: "Enable PAPER=1 in settings.", category: "Trading" },
  { q: "How to switch mode?", a: "Change MODE to demo|hybrid|live.", category: "Configuration" },
  { q: "Where can I find the legal terms?", a: "Go to Support > Documentation > Términos Legales & Privacidad, or click the legal button in the modal.", category: "General" },
  { q: "What is the maximum risk per trade?", a: "The platform enforces a maximum of 5% of your equity per trade to protect your capital.", category: "Security" },
  { q: "Is this platform safe for trading?", a: "Yes, the platform uses paper trading by default and includes comprehensive risk management features.", category: "Security" },
  { q: "How do I access the documentation?", a: "Go to Support > Documentation tab to access all technical and business documentation.", category: "General" },
];

// History (manual/AI)
export const MOCK_MANUAL_TRADES = [
  { 
    id: "m1", 
    time: Date.now() - 7200000, 
    timestamp: Date.now() - 7200000,
    symbol: "BTC/USDT", 
    asset: "BTC/USDT",
    side: "BUY", 
    type: "BUY",
    qty: 0.005, 
    size: 0.005,
    price: 59800, 
    entryPrice: 59800,
    exitPrice: 59800 * 1.0009, // +0.09% profit
    fee: 0.1, 
    pnl: 5.4,
    pl: 5.4
  },
];
export const MOCK_AI_TRADES = [
  { 
    id: "a1", 
    time: Date.now() - 3600000, 
    timestamp: Date.now() - 3600000,
    symbol: "ETH/USDT", 
    asset: "ETH/USDT",
    side: "SELL", 
    type: "SELL",
    qty: 0.1, 
    size: 0.1,
    price: 2550, 
    entryPrice: 2550,
    exitPrice: 2550 * 0.9992, // -0.08% loss
    fee: 0.1, 
    pnl: -2.1,
    pl: -2.1,
    confidence: 85
  },
];
export const MOCK_AI_INTERACTIONS = [
  { id: "x1", timestamp: Date.now() - 120000, type: "Q&A", details: "Trend now?", userAction: "reviewed", response: "Sideways; wait for breakout.", responseTime: 1800 },
];

export const MOCK_PORTFOLIO_EVENTS = Array.from({length: 12}, (_,i)=>({
  id: i+1,
  timestamp: Date.now() - (i+1)*3600_000,
  type: i%3===0?'BUY':(i%3===1?'SELL':'REBALANCE'),
  asset: ['BTC','ETH','SOL'][i%3],
  amount: +(Math.random()*2).toFixed(4),
  value: Math.round(1000+Math.random()*5000),
  status: 'completed'
}));

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
