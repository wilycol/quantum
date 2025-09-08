// src/app/qcore/lib/types.ts
// QuantumCore v2 Types and Interfaces

export type Broker = 'binance' | 'zaffer';
export type Mode = 'shadow' | 'live';
export type Strategy = 'grid' | 'binary';
export type BinaryDirection = 'CALL' | 'PUT';
export type BinaryResult = 'WIN' | 'LOSE' | 'PENDING';
export type WsStatus = 'disconnected' | 'connecting' | 'connected';

export interface RiskConfig {
  maxOrderPct: number;
  dailyStopPct?: number;
}

export interface GridConfig {
  size: number;
  lower: number;
  upper: number;
  stepPct: number;
}

export interface BinaryConfig {
  amount: number;
  expiry: number;
  direction: BinaryDirection;
}

export interface KPIs {
  elapsed: number;
  balance: number;
  pnl: number;
  trades: number;
  winRate: number;
}

export interface ConnectorStatus {
  binance: boolean;
  zaffer: boolean;
}

export interface QcoreState {
  // Core configuration
  broker: Broker;
  strategy: Strategy;
  mode: Mode;
  
  // Assets and display
  assets: string[];
  volumeOn: boolean;
  
  // Configuration objects
  risk: RiskConfig;
  grid: GridConfig;
  binary: BinaryConfig;
  
  // State tracking
  kpis: KPIs;
  connected: ConnectorStatus;
  wsStatus: WsStatus;
  
  // UI state
  killSwitchActive: boolean;
  showModeConfirmModal: boolean;
}

// WebSocket Event Types
export interface PreviewEvent {
  t: 'preview';
  broker: Broker;
  pair?: string;        // for spot trading
  asset?: string;       // for binary trading
  side?: 'BUY' | 'SELL'; // for spot
  dir?: BinaryDirection; // for binary
  price?: number;
  strike?: number;
  sl?: number;
  tp?: number;
  rr?: number;
  conf?: number;
  ts: number;
}

export interface ExecutedEvent {
  t: 'executed' | 'binary_executed';
  orderId?: string;
  ticketId?: string;
  pair?: string;
  asset?: string;
  side?: 'BUY' | 'SELL';
  dir?: BinaryDirection;
  fillPrice?: number;
  amount?: number;
  payout?: number;
  pnl?: number;
  net?: number;
  result?: BinaryResult;
  ts: number;
}

export type WsEvent = PreviewEvent | ExecutedEvent;

// Chart overlay types
export interface ChartOverlay {
  id: string;
  type: 'grid' | 'sl' | 'tp' | 'strike' | 'countdown';
  data: any;
  visible: boolean;
}

export interface ChartMarker {
  id: string;
  type: 'preview' | 'executed' | 'cancel';
  time: number;
  price: number;
  side?: 'BUY' | 'SELL';
  direction?: BinaryDirection;
  data: any;
}

// Log entry types
export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  data?: any;
}

// IA Coach types
export interface CoachMessage {
  id: string;
  timestamp: number;
  message: string;
  confidence: number;
  reactionTime?: number;
  nextHintIn?: number;
}

// API Response types
export interface HealthResponse {
  status: 'ok' | 'error';
  latency?: number;
  error?: string;
}

export interface ConnectResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Form validation types
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Asset configuration
export interface AssetConfig {
  symbol: string;
  name: string;
  broker: Broker;
  type: 'spot' | 'binary';
  minAmount?: number;
  maxAmount?: number;
  stepSize?: number;
}

// Default configurations
export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxOrderPct: 0.05,
  dailyStopPct: 0.1
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  size: 7,
  lower: 11000,
  upper: 11400,
  stepPct: 0.4
};

export const DEFAULT_BINARY_CONFIG: BinaryConfig = {
  amount: 50,
  expiry: 60,
  direction: 'CALL'
};

export const DEFAULT_KPIS: KPIs = {
  elapsed: 0,
  balance: 10000,
  pnl: 0,
  trades: 0,
  winRate: 0
};

// Asset lists by broker
export const BINANCE_ASSETS: AssetConfig[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', broker: 'binance', type: 'spot' },
  { symbol: 'ETHUSDT', name: 'Ethereum', broker: 'binance', type: 'spot' },
  { symbol: 'BNBUSDT', name: 'BNB', broker: 'binance', type: 'spot' },
  { symbol: 'ADAUSDT', name: 'Cardano', broker: 'binance', type: 'spot' },
  { symbol: 'SOLUSDT', name: 'Solana', broker: 'binance', type: 'spot' }
];

export const ZAFFER_ASSETS: AssetConfig[] = [
  { symbol: 'BTCUSD', name: 'Bitcoin Binary', broker: 'zaffer', type: 'binary' },
  { symbol: 'ETHUSD', name: 'Ethereum Binary', broker: 'zaffer', type: 'binary' },
  { symbol: 'EURUSD', name: 'EUR/USD Binary', broker: 'zaffer', type: 'binary' },
  { symbol: 'GBPUSD', name: 'GBP/USD Binary', broker: 'zaffer', type: 'binary' }
];

// Binary expiry options
export const BINARY_EXPIRY_OPTIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 300, label: '5m' },
  { value: 600, label: '10m' }
];
