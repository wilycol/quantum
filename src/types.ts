export type MainView = 'quantum_core' | 'manual_trading' | 'desk' | 'simulator' | 'portfolio' | 'settings' | 'news' | 'support' | 'notifications' | 'history' | 'legal';

export interface WalletData {
  balance: number;
  equity: number;
  profit: number;
  freeMargin: number;
  usedMargin: number;
  credit: number;
}

export interface Position {
  id: number;
  instrument: string;
  type: 'BUY' | 'SELL';
  size: number;
  openPrice: number;
  currentPrice: number;
  pl: number;
}

export interface ChartDataPoint {
  name: string;
  price: number;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  aiSignal?: string;
}

export interface IndicatorDataPoint {
    time: string;
    value: number;
}

export type PredictionStatus = 'PENDING' | 'EXECUTED' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface AIPrediction {
  id: string;
  timestamp: number;
  instrument: string;
  prediction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  status: PredictionStatus;
  executionTime?: number;
  result?: 'SUCCESS' | 'FAILED';
  actualPrice?: number;
  predictedPrice?: number;
}

export interface SimulationConfig {
  initialBalance: number;
  riskPerTrade: number;
  maxPositions: number;
  stopLoss: number;
  takeProfit: number;
  leverage: number;
  // Propiedades adicionales para compatibilidad
  initialAmount?: number;
  simulationTime?: number;
  assets?: any[];
  riskTolerance?: number;
  riskLevel?: string;
  useAI?: boolean;
}

export interface SimulatedTrade {
  id: string;
  timestamp: number;
  instrument: string;
  type: 'BUY' | 'SELL';
  size: number;
  entryPrice: number;
  exitPrice?: number;
  pl?: number;
  status: 'OPEN' | 'CLOSED';
  reasoning?: string;
  // Propiedades adicionales para compatibilidad
  action?: 'BUY' | 'SELL';
  investedAmount?: number;
  confidence?: number;
  reason?: string;
  profit?: number;
  exitTimestamp?: number;
  exitTrigger?: string;
}

export interface SimulationMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  // Propiedades adicionales para compatibilidad
  initialBalance?: number;
  currentBalance?: number;
  totalProfit?: number;
}

export interface AssetState {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap?: number;
  // Propiedades adicionales para compatibilidad
  instrument?: string;
  priceHistory?: any[];
  confidence?: number;
  rsi?: number;
  trend?: string;
  noise?: number;
  momentum?: number;
  signalReliability?: number;
}

export interface NewsArticle {
  id?: number | string;
  title: string;
  source?: string;
  url?: string;
  impact?: string;
  category?: string;
  summary?: string;
}

export interface FAQItem {
  q: string;
  a: string;
  // Propiedades adicionales para compatibilidad
  category?: string;
}

export interface NotificationConfig {
  pushEnabled: boolean;
  triggers: {
    highConfidenceAI: boolean;
    significantMoves: boolean;
  };
  integrations: {
    whatsApp: { enabled: boolean; number: string };
    telegram: { enabled: boolean; username: string };
  };
}

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  linkTo?: MainView;
  timestamp: number;
  isRead: boolean;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'news_high_impact' | 'portfolio_warning' | 'trade_executed' | 'ai_alert';

export interface GitHubConfig {
  token: string;
  repoUrl: string;
  branch: string;
}

export interface AIStrategyConfig {
  rsiPeriod: number;
  rsiBuy: number;
  rsiSell: number;
  takeProfitPct: number;
  stopLossPct: number;
  // Propiedades adicionales para compatibilidad
  profile?: 'Conservador' | 'Medio' | 'Agresivo' | 'Personalizado';
}

export interface UserRiskConfig {
  maxDailyLossPct: number;
  maxPositionPct: number;
  leverage: number;
  slippageBps: number;
  // Propiedades adicionales para compatibilidad
  stopLossValue?: number;
  stopLossType?: string;
  takeProfitValue?: number;
  takeProfitType?: string;
  maxInvestmentPerTrade?: number;
  maxOpenTrades?: number;
  rules?: {
    [key: string]: boolean;
  };
}

export interface PortfolioAsset {
  symbol: string;
  amount: number;
  price: number;
  value: number;
  change24h: number;
  allocation: number;
}

export interface AIDecision {
  id: string;
  timestamp: number;
  decision: string;
  asset: string;
  confidence: number;
  reason: string;
}

export interface DemoTrade {
  id: string;
  timestamp: number;
  instrument: string;
  type: 'BUY' | 'SELL';
  size: number;
  price: number;
  pl: number;
  reasoning: string;
  // Propiedades adicionales para compatibilidad
  time?: number;
  action?: 'BUY' | 'SELL';
  reactionTime?: number;
  wasCorrectAction?: boolean;
  feedback?: string;
}

export interface ManualTradeHistory {
  id: string;
  timestamp: number;
  asset: string;
  type: 'BUY' | 'SELL';
  size: number;
  entryPrice: number;
  exitPrice: number;
  pl: number;
}

export interface AITradeHistory {
  id: string;
  timestamp: number;
  asset: string;
  type: 'BUY' | 'SELL';
  size: number;
  entryPrice: number;
  exitPrice: number;
  pl: number;
  confidence: number;
}

export interface AIInteractionLog {
  id: string;
  timestamp: number;
  type: string;
  details: string;
  userAction: string;
  response: string;
  responseTime: number;
}
