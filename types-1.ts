
export type MainView = 'quantum_core' | 'desk' | 'simulator' | 'portfolio' | 'settings' | 'news' | 'support' | 'notifications' | 'history';

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
  instrument: string;
  prediction: 'BUY' | 'SELL';
  confidence: number; // 0 to 100
  status: PredictionStatus;
  entryPrice?: number;
  exitPrice?: number;
  pl?: number;
  timestamp: number;
}

export interface SimulationConfig {
    initialAmount: number;
    simulationTime: number; // in minutes
    assets: string[];
    riskLevel: 'Conservative' | 'Balanced' | 'Aggressive';
    riskTolerance: number; // 0 (Cautious) to 100 (Fearless)
    useAI: boolean;
}

export interface SimulatedTrade {
    id: string;
    instrument: string;
    action: 'BUY' | 'SELL';
    entryPrice: number;
    exitPrice?: number;
    profit?: number;
    timestamp: number;
    status: 'OPEN' | 'CLOSED';
    confidence?: number;
    reason?: string;
    investedAmount?: number;
    returnedAmount?: number;
    exitTimestamp?: number;
    exitStrategy?: string;
    // Fields for detailed CSV export
    modeAtEntry?: string;
    aiPhaseAtEntry?: string;
    signalReliabilityAtEntry?: number;
    trendAtEntry?: 'UP' | 'DOWN' | 'SIDEWAYS';
    momentumAtEntry?: number;
    volatilityAtEntry?: number;
    weeklyReportId?: string;
    // New fields for extended CSV export
    stopLossPercent?: number;
    takeProfitPercent?: number;
    exitTrigger?: string;
    environment?: 'Production' | 'Test' | 'Sandbox';
}

export interface SimulationMetrics {
    initialBalance: number;
    currentBalance: number;
    totalProfit: number;
    totalTrades: number;
    winRate: number; // as a percentage
}

export interface AssetState {
    instrument: string;
    priceHistory: Candle[];
    confidence: number;
    rsi: number;
    trend: 'UP' | 'DOWN' | 'SIDEWAYS';
    // New detailed analysis parameters
    noise: number; // Volatility
    volume: number; // Trading volume
    momentum: number; // Rate of price change
    signalReliability: number; // Consistency of signals
}

export interface AIDecision {
  id: string;
  timestamp: number;
  asset: string;
  decision: 'HOLD' | 'EXECUTE_BUY' | 'EXECUTE_SELL';
  reason: string;
  confidence: number;
}

export interface DemoTrade {
    id: number;
    price: number;
    time: number;
    action: 'BUY' | 'SELL';
    pl?: number;
    wasCorrectAction?: boolean;
    reactionTime?: number;
    feedback?: string;
}

export interface PortfolioAsset {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  category: 'Crypto' | 'Stocks' | 'Forex' | 'Fiat';
  amount: number;
  entryPrice: number;
  currentPrice: number;
  totalValue: number;
  pl: number;
  plPercent: number;
}

export interface PortfolioHistoryItem {
    id: string;
    timestamp: number;
    type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL';
    asset: string;
    amount: number;
    value: number;
    status: 'Completed' | 'Pending';
}

export interface UserRiskConfig {
    stopLossType: 'percent' | 'value';
    stopLossValue: number;
    takeProfitType: 'percent' | 'value';
    takeProfitValue: number;
    maxInvestmentPerTrade: number;
    maxOpenTrades: number;
    rules: {
        requireStopLoss: boolean;
        preventHighVolatility: boolean;
    };
}

export interface AIStrategyConfig {
    profile: 'Conservador' | 'Medio' | 'Agresivo' | 'Personalizado';
    // Custom settings would go here
}

export interface MarketPrice {
    id: string;
    name: string;
    icon: string;
    category: 'Crypto' | 'Stocks' | 'Forex' | 'Commodities';
    price: number;
    change24h: number;
    source: string;
}

export interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    source: string;
    timestamp: number;
    category: 'Crypto' | 'Stocks' | 'Forex' | 'Commodities' | 'Global';
    impact: 'High' | 'Medium' | 'Low';
}

export interface NotificationConfig {
    pushEnabled: boolean;
    triggers: {
        highConfidenceAI: boolean;
        significantMoves: boolean;
    };
    integrations: {
        whatsApp: {
            enabled: boolean;
            number: string;
        };
        telegram: {
            enabled: boolean;
            username: string;
        };
    };
}

export interface FAQItem {
    id: string;
    category: 'General' | 'Trading' | 'AI' | 'Security' | 'Portfolio';
    question: string;
    answer: string;
}

export type NotificationType = 'ai_alert' | 'trade_executed' | 'portfolio_warning' | 'news_high_impact' | 'info';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  linkTo?: MainView;
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
  status: 'Closed' | 'Cancelled';
  module: 'QuantumDesk';
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
  status: 'Closed' | 'Cancelled';
  confidence: number;
  reason: string;
}

export interface AIInteractionLog {
  id: string;
  timestamp: number;
  type: 'Recommendation' | 'Alert' | 'Analysis Request';
  asset?: string;
  details: string;
  userAction: 'Followed' | 'Ignored' | 'Reviewed';
  responseTime?: number;
}

export interface GitHubConfig {
    token: string;
    repoUrl: string;
    branch: string;
}

export interface ActiveAIDecision {
    id: string;
    asset: string;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    justification: string;
    confidence: number;
    status: 'Executing' | 'Monitoring';
    timestamp: number;
}

export interface AIPerformanceDataPoint {
    week: string;
    roi: number; // in percent
    successRate: number; // in percent
    trades: number;
}