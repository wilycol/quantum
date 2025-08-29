
import { WalletData, Position, ChartDataPoint, Candle, IndicatorDataPoint, AIPrediction, AIDecision, PortfolioAsset, PortfolioHistoryItem, UserRiskConfig, AIStrategyConfig, MarketPrice, NewsArticle, FAQItem, ManualTradeHistory, AITradeHistory, AIInteractionLog, ActiveAIDecision, AIPerformanceDataPoint } from './types';

export const MOCK_WALLET_DATA: WalletData = {
  balance: 100520.75,
  equity: 102780.25,
  profit: 2259.50,
  freeMargin: 98000.00,
  usedMargin: 4780.25,
  credit: 5000.00,
};

export const MOCK_POSITIONS: Position[] = [
  { id: 1, instrument: 'EUR/USD', type: 'BUY', size: 1.5, openPrice: 1.0750, currentPrice: 1.0855, pl: 1575.00 },
  { id: 2, instrument: 'TSLA', type: 'BUY', size: 10, openPrice: 175.40, currentPrice: 181.20, pl: 580.00 },
  { id: 3, instrument: 'BTC/USD', type: 'SELL', size: 0.1, openPrice: 68500, currentPrice: 67950, pl: 55.00 },
  { id: 4, instrument: 'GOLD', type: 'BUY', size: 5, openPrice: 2330.10, currentPrice: 2328.00, pl: -10.50 },
  { id: 5, instrument: 'USD/JPY', type: 'SELL', size: 2.0, openPrice: 157.10, currentPrice: 156.85, pl: 50.00 },
];

export const MOCK_CHART_DATA: ChartDataPoint[] = [
    { name: '12:00', price: 1.0825 },
    { name: '13:00', price: 1.0831 },
    { name: '14:00', price: 1.0819 },
    { name: '15:00', price: 1.0840 },
    { name: '16:00', price: 1.0852 },
    { name: '17:00', price: 1.0848 },
    { name: '18:00', price: 1.0860 },
    { name: '19:00', price: 1.0855 },
];

export const MOCK_CANDLESTICK_DATA: Candle[] = [
    { time: '12:00', open: 1.0825, high: 1.0835, low: 1.0820, close: 1.0831, volume: 1200 },
    { time: '13:00', open: 1.0831, high: 1.0840, low: 1.0818, close: 1.0819, volume: 1500 },
    { time: '14:00', open: 1.0819, high: 1.0842, low: 1.0815, close: 1.0840, volume: 1800 },
    { time: '15:00', open: 1.0840, high: 1.0855, low: 1.0838, close: 1.0852, volume: 2500 },
    { time: '16:00', open: 1.0852, high: 1.0853, low: 1.0845, close: 1.0848, volume: 2000 },
    { time: '17:00', open: 1.0848, high: 1.0862, low: 1.0847, close: 1.0860, volume: 3000, aiSignal: 'BULLISH_CANDLE' },
    { time: '18:00', open: 1.0860, high: 1.0865, low: 1.0850, close: 1.0855, volume: 2200 },
    { time: '19:00', open: 1.0855, high: 1.0858, low: 1.0845, close: 1.0847, volume: 1900 },
];

export const MOCK_RSI_DATA: IndicatorDataPoint[] = [
    { time: '12:00', value: 60 }, { time: '13:00', value: 45 }, { time: '14:00', value: 65 },
    { time: '15:00', value: 75 }, { time: '16:00', value: 70 }, { time: '17:00', value: 80 },
    { time: '18:00', value: 72 }, { time: '19:00', value: 68 },
];

export const MOCK_MACD_DATA = {
    macd: [
        { time: '12:00', value: 0.0001 }, { time: '13:00', value: -0.0002 }, { time: '14:00', value: 0.0003 },
        { time: '15:00', value: 0.0005 }, { time: '16:00', value: 0.0004 }, { time: '17:00', value: 0.0006 },
        { time: '18:00', value: 0.0005 }, { time: '19:00', value: 0.0004 },
    ],
    signal: [
        { time: '12:00', value: 0.00005 }, { time: '13:00', value: -0.0001 }, { time: '14:00', value: 0.00015 },
        { time: '15:00', value: 0.00025 }, { time: '16:00', value: 0.0003 }, { time: '17:00', value: 0.0004 },
        { time: '18:00', value: 0.00045 }, { time: '19:00', value: 0.00042 },
    ],
    histogram: [
        { time: '12:00', value: 0.00005 }, { time: '13:00', value: -0.0001 }, { time: '14:00', value: 0.00015 },
        { time: '15:00', value: 0.00025 }, { time: '16:00', value: 0.0001 }, { time: '17:00', value: 0.0002 },
        { time: '18:00', value: 0.00005 }, { time: '19:00', value: -0.00002 },
    ]
};

export const MOCK_AI_PREDICTIONS: AIPrediction[] = [
    { id: 'pred_1', instrument: 'BTC/USD', prediction: 'BUY', confidence: 92, status: 'SUCCESS', pl: 150.25, timestamp: Date.now() - 10000 },
    { id: 'pred_2', instrument: 'ETH/USD', prediction: 'BUY', confidence: 85, status: 'FAILED', pl: -75.50, timestamp: Date.now() - 20000 },
    { id: 'pred_3', instrument: 'SOL/USD', prediction: 'SELL', confidence: 78, status: 'PENDING', timestamp: Date.now() - 5000 },
    { id: 'pred_4', instrument: 'NVIDIA', prediction: 'BUY', confidence: 95, status: 'PENDING', timestamp: Date.now() - 2000 },
    { id: 'pred_5', instrument: 'GOLD', prediction: 'SELL', confidence: 88, status: 'CANCELLED', timestamp: Date.now() - 30000 },
];

export const MOCK_AI_DECISIONS: AIDecision[] = [
    { id: 'd1', timestamp: Date.now() - 5000, asset: 'EUR/USD', decision: 'EXECUTE_BUY', reason: 'Bullish momentum confirmed on 1H chart. RSI below 30.', confidence: 85 },
    { id: 'd2', timestamp: Date.now() - 15000, asset: 'TSLA', decision: 'HOLD', reason: 'High volatility, waiting for clearer signal. MACD crossing.', confidence: 60 },
    { id: 'd3', timestamp: Date.now() - 35000, asset: 'BTC/USD', decision: 'EXECUTE_SELL', reason: 'Resistance at 68k holding strong. Bearish divergence spotted.', confidence: 78 },
    { id: 'd4', timestamp: Date.now() - 65000, asset: 'EUR/USD', decision: 'HOLD', reason: 'Approaching support level, monitoring price action.', confidence: 55 },
    { id: 'd5', timestamp: Date.now() - 85000, asset: 'ETH/USD', decision: 'HOLD', reason: 'Channel consolidation, awaiting breakout for confirmation.', confidence: 65 },
];

export const MOCK_PORTFOLIO_ASSETS: PortfolioAsset[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: '₿', category: 'Crypto', amount: 2.5, entryPrice: 60000, currentPrice: 67525, totalValue: 168812.5, pl: 18812.5, plPercent: 12.54 },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', category: 'Crypto', amount: 20, entryPrice: 3000, currentPrice: 3501.5, totalValue: 70030, pl: 10030, plPercent: 16.72 },
  { id: 'tsla', name: 'Tesla Inc.', symbol: 'TSLA', icon: '🇺🇸', category: 'Stocks', amount: 100, entryPrice: 175, currentPrice: 180.60, totalValue: 18060, pl: 560, plPercent: 3.2 },
  { id: 'eurusd', name: 'Euro/US Dollar', symbol: 'EUR/USD', icon: '🇪🇺/🇺🇸', category: 'Forex', amount: 50000, entryPrice: 1.0750, currentPrice: 1.0855, totalValue: 54275, pl: 525, plPercent: 0.98 },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: '₮', category: 'Fiat', amount: 25000, entryPrice: 1.00, currentPrice: 1.00, totalValue: 25000, pl: 0, plPercent: 0 },
];

export const MOCK_REAL_PORTFOLIO_ASSETS: PortfolioAsset[] = [
  { id: 'btc-real', name: 'Bitcoin', symbol: 'BTC', icon: '₿', category: 'Crypto', amount: 1.2, entryPrice: 55000, currentPrice: 67525, totalValue: 81030, pl: 15030, plPercent: 12.14 },
  { id: 'eth-real', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', category: 'Crypto', amount: 15, entryPrice: 3200, currentPrice: 3501.5, totalValue: 52522.5, pl: 4522.5, plPercent: 9.42 },
  { id: 'googl-real', name: 'Alphabet Inc.', symbol: 'GOOGL', icon: '🇺🇸', category: 'Stocks', amount: 50, entryPrice: 170, currentPrice: 145.50, totalValue: 7275, pl: -1225, plPercent: -14.41 },
  { id: 'usdc-real', name: 'USD Coin', symbol: 'USDC', icon: 'C', category: 'Fiat', amount: 15000, entryPrice: 1.00, currentPrice: 1.00, totalValue: 15000, pl: 0, plPercent: 0 },
];

export const MOCK_PORTFOLIO_HISTORY: PortfolioHistoryItem[] = [
  { id: 'h1', timestamp: Date.now() - 86400000, type: 'BUY', asset: 'BTC', amount: 0.5, value: 32500, status: 'Completed' },
  { id: 'h2', timestamp: Date.now() - 172800000, type: 'DEPOSIT', asset: 'USDT', amount: 10000, value: 10000, status: 'Completed' },
  { id: 'h3', timestamp: Date.now() - 259200000, type: 'SELL', asset: 'TSLA', amount: 10, value: 1800, status: 'Completed' },
  { id: 'h4', timestamp: Date.now() - 345600000, type: 'WITHDRAWAL', asset: 'Fiat', amount: 5000, value: 5000, status: 'Completed' },
  { id: 'h5', timestamp: Date.now() - 432000000, type: 'BUY', asset: 'ETH', amount: 5, value: 16500, status: 'Completed' },
];

export const MOCK_PORTFOLIO_EVOLUTION = [
    { time: 'Mar', value: 280500 },
    { time: 'Apr', value: 295000 },
    { time: 'May', value: 310200 },
    { time: 'Jun', value: 305800 },
    { time: 'Jul', value: 325400 },
    { time: 'Aug', value: 336177.5 },
];

export const DEFAULT_USER_RISK_CONFIG: UserRiskConfig = {
    stopLossType: 'percent',
    stopLossValue: 5,
    takeProfitType: 'percent',
    takeProfitValue: 10,
    maxInvestmentPerTrade: 1000,
    maxOpenTrades: 5,
    rules: {
        requireStopLoss: true,
        preventHighVolatility: false,
    },
};

export const DEFAULT_AI_STRATEGY_CONFIG: AIStrategyConfig = {
    profile: 'Medio',
};

export const MOCK_MARKET_PRICES: MarketPrice[] = [
    { id: 'btc', name: 'Bitcoin', icon: '₿', category: 'Crypto', price: 67525.00, change24h: 2.5, source: 'CoinGecko' },
    { id: 'eth', name: 'Ethereum', icon: 'Ξ', category: 'Crypto', price: 3501.50, change24h: 1.8, source: 'CoinGecko' },
    { id: 'gold', name: 'Gold', icon: '🥇', category: 'Commodities', price: 2330.10, change24h: -0.5, source: 'GoldAPI' },
    { id: 'tsla', name: 'Tesla Inc.', icon: '🇺🇸', category: 'Stocks', price: 180.60, change24h: 3.1, source: 'Alpha Vantage' },
    { id: 'eurusd', name: 'EUR/USD', icon: '🇪🇺/🇺🇸', category: 'Forex', price: 1.0855, change24h: 0.1, source: 'Twelve Data' },
];

export const MOCK_NEWS_ARTICLES: NewsArticle[] = [
    { id: 'n1', title: 'Federal Reserve Hints at Slower Rate Hikes, Boosting Markets', summary: 'The US Federal Reserve has signaled a potential slowdown in its aggressive interest rate hike cycle, leading to a bullish sentiment across stock and crypto markets.', source: 'Reuters', timestamp: Date.now() - 3600000, category: 'Global', impact: 'High' },
    { id: 'n2', title: 'Ethereum\'s "Dencun" Upgrade Pushes Gas Fees to Record Lows', summary: 'Following the successful implementation of the Dencun upgrade, transaction fees on the Ethereum network have dropped significantly, increasing usability and developer activity.', source: 'CoinDesk', timestamp: Date.now() - 7200000, category: 'Crypto', impact: 'High' },
    { id: 'n3', title: 'Crude Oil Prices Surge Amid Geopolitical Tensions in the Middle East', summary: 'Renewed tensions in the Middle East have caused a spike in crude oil prices, impacting global inflation forecasts and commodity markets.', source: 'Bloomberg', timestamp: Date.now() - 10800000, category: 'Commodities', impact: 'Medium' },
    { id: 'n4', title: 'Nvidia Unveils Next-Gen AI Chips, Stock Soars', summary: 'Nvidia announced its new Blackwell architecture for AI GPUs, promising a significant leap in performance and efficiency, which sent its stock price soaring in after-hours trading.', source: 'The Verge', timestamp: Date.now() - 14400000, category: 'Stocks', impact: 'High' },
    { id: 'n5', title: 'European Central Bank Holds Rates Steady, Cites Inflation Concerns', summary: 'The ECB has decided to maintain its current interest rates, adopting a cautious stance as it continues to monitor persistent inflation within the Eurozone.', source: 'Financial Times', timestamp: Date.now() - 18000000, category: 'Forex', impact: 'Medium' },
];

export const MOCK_FAQS: FAQItem[] = [
    {
        id: 'faq1',
        category: 'General',
        question: 'What is QuantumTrade AI?',
        answer: 'QuantumTrade AI is an advanced trading platform that combines manual trading with powerful AI-assisted tools. It offers features like real-time market data, an AI simulator, intelligent portfolio management, and a risk management system to enhance your trading experience.'
    },
    {
        id: 'faq2',
        category: 'Trading',
        question: 'How do I execute a trade?',
        answer: 'You can execute a trade from the "Quantum Desk" module. Select an asset from the Market Watch, set your trade size, Stop Loss, and Take Profit in the execution panel, and then click the BUY or SELL button. You can also enable "1-Click Trading" to bypass confirmation dialogs.'
    },
    {
        id: 'faq3',
        category: 'AI',
        question: 'How does the AI Assistant work?',
        answer: 'The AI Assistant provides real-time analysis, trade suggestions, and risk assessments. You can request advice on demand or receive proactive alerts based on your configured intensity level. In the "Full Demo" mode, the AI also acts as a coach to help you practice.'
    },
    {
        id: 'faq4',
        category: 'Portfolio',
        question: 'Can I connect my external exchange account?',
        answer: 'Yes, the "Intelligent Portfolio" module allows you to connect to major exchanges like Binance, Bybit, and OKX, as well as Web3 wallets like Metamask. This feature is for viewing your consolidated portfolio. Direct trading via API may be supported in future updates.'
    },
    {
        id: 'faq5',
        category: 'Security',
        question: 'Is my data secure?',
        answer: 'Security is our top priority. All API keys and sensitive information are encrypted. We recommend using a strong, unique password for your account and enabling two-factor authentication (2FA) if available. The platform uses secure connections (HTTPS) for all data transmission.'
    },
];

export const MOCK_MANUAL_TRADES: ManualTradeHistory[] = [
    { id: 'm1', timestamp: Date.now() - 86400000, asset: 'EUR/USD', type: 'BUY', size: 1.0, entryPrice: 1.0750, exitPrice: 1.0850, pl: 100.00, status: 'Closed', module: 'QuantumDesk' },
    { id: 'm2', timestamp: Date.now() - 172800000, asset: 'TSLA', type: 'SELL', size: 5, entryPrice: 182.00, exitPrice: 180.00, pl: 10.00, status: 'Closed', module: 'QuantumDesk' },
];

export const MOCK_AI_TRADES: AITradeHistory[] = [
    { id: 'ai1', timestamp: Date.now() - 259200000, asset: 'BTC/USD', type: 'BUY', size: 0.1, entryPrice: 65000, exitPrice: 66500, pl: 150.00, status: 'Closed', confidence: 92, reason: 'Bullish divergence detected' },
    { id: 'ai2', timestamp: Date.now() - 345600000, asset: 'ETH/USD', type: 'SELL', size: 1.5, entryPrice: 3600, exitPrice: 3650, pl: -75.00, status: 'Closed', confidence: 85, reason: 'Approaching strong resistance' },
    { id: 'ai3', timestamp: Date.now() - 432000000, asset: 'GOLD', type: 'BUY', size: 10, entryPrice: 2300, exitPrice: 2305, pl: 50.00, status: 'Closed', confidence: 88, reason: 'Support level held' },
];

export const MOCK_AI_INTERACTIONS: AIInteractionLog[] = [
    { id: 'int1', timestamp: Date.now() - 900000, type: 'Recommendation', asset: 'EUR/USD', details: 'Consider BUY based on strong bullish momentum.', userAction: 'Followed', responseTime: 12 },
    { id: 'int2', timestamp: Date.now() - 1800000, type: 'Alert', asset: 'TSLA', details: 'High volatility detected. Advise holding.', userAction: 'Reviewed' },
    { id: 'int3', timestamp: Date.now() - 3600000, type: 'Recommendation', asset: 'BTC/USD', details: 'Potential SELL opportunity at 68k resistance.', userAction: 'Ignored' },
];

export const MOCK_ACTIVE_AI_DECISIONS: ActiveAIDecision[] = [
    { id: 'd-act-1', asset: 'BTC/USD', type: 'BUY', entryPrice: 67510.50, justification: 'Breakout above short-term resistance confirmed.', confidence: 92, status: 'Executing', timestamp: Date.now() - 5000 },
    { id: 'd-act-2', asset: 'EUR/USD', type: 'SELL', entryPrice: 1.0855, justification: 'RSI showing bearish divergence on 15m chart.', confidence: 88, status: 'Monitoring', timestamp: Date.now() - 65000 },
    { id: 'd-act-3', asset: 'TSLA', type: 'BUY', entryPrice: 180.55, justification: 'High volume spike indicates bullish interest.', confidence: 85, status: 'Monitoring', timestamp: Date.now() - 125000 },
];

export const MOCK_AI_PERFORMANCE_DATA: AIPerformanceDataPoint[] = [
    { week: 'W1', roi: 1.2, successRate: 65, trades: 15 },
    { week: 'W2', roi: 2.5, successRate: 72, trades: 21 },
    { week: 'W3', roi: 1.8, successRate: 68, trades: 18 },
    { week: 'W4', roi: 3.1, successRate: 78, trades: 25 },
];
