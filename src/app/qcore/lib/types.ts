// src/app/qcore/lib/types.ts
// Type definitions for QuantumCore v2

export type Broker = 'binance' | 'zaffer';
export type Mode = 'shadow' | 'live';
export type Strategy = 'grid' | 'binary';

export interface GridConfig {
  size: number;
  lower: number;
  upper: number;
  stepPct: number;
}

export interface BinaryConfig {
  amount: number;
  expiry: number;
  direction: 'CALL' | 'PUT';
}

export interface RiskConfig {
  maxOrderPct: number;
  dailyStopPct: number;
}

export interface KPIs {
  elapsed: number;
  balance: number;
  pnl: number;
  trades: number;
  winRate: number;
}

export interface QcoreState {
  // Core settings
  broker: Broker;
  strategy: Strategy;
  mode: Mode;
  assets: string[];
  volumeOn: boolean;
  
  // Configurations
  grid: GridConfig;
  binary: BinaryConfig;
  risk: RiskConfig;
  
  // KPIs
  kpis: KPIs;
  
  // WebSocket status
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  connected: boolean;
  
  // Kill switch
  killSwitchActive: boolean;
  
  // Logs
  logs: LogEntry[];
  
  // Timeline
  timeline: TimelineEntry[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  data?: any;
}

export interface TimelineEntry {
  id: string;
  timestamp: number;
  type: 'preview' | 'executed' | 'binary_preview' | 'binary_executed';
  data: any;
  pnl?: number;
}

// WebSocket event types
export interface WsEvent {
  t: string;
  ts: number;
  [key: string]: any;
}

export interface PreviewEvent extends WsEvent {
  t: 'preview';
  broker: Broker;
  pair: string;
  side: 'BUY' | 'SELL';
  price: number;
  sl?: number;
  tp?: number;
  rr?: number;
  conf: number;
}

export interface ExecutedEvent extends WsEvent {
  t: 'executed';
  orderId: string;
  pair: string;
  side: 'BUY' | 'SELL';
  fillPrice: number;
  qty: number;
  sl?: number;
  tp?: number;
  pnl?: number;
}

export interface BinaryPreviewEvent extends WsEvent {
  t: 'binary_preview';
  asset: string;
  dir: 'CALL' | 'PUT';
  strike: number;
  expiry: number;
  amount: number;
  payout: number;
  conf: number;
}

export interface BinaryExecutedEvent extends WsEvent {
  t: 'binary_executed';
  ticketId: string;
  result: 'WIN' | 'LOSE' | 'PENDING';
  amount: number;
  payout: number;
  net: number;
}

// Chart types
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Volume {
  time: number;
  value: number;
}

// Validation helpers
export function isValidGridConfig(config: GridConfig): boolean {
  return (
    Number.isFinite(config.size) &&
    config.size > 0 &&
    Number.isFinite(config.lower) &&
    Number.isFinite(config.upper) &&
    config.upper > config.lower &&
    Number.isFinite(config.stepPct) &&
    config.stepPct > 0 &&
    config.stepPct <= 1
  );
}

export function isValidBinaryConfig(config: BinaryConfig): boolean {
  return (
    Number.isFinite(config.amount) &&
    config.amount > 0 &&
    Number.isFinite(config.expiry) &&
    config.expiry > 0 &&
    (config.direction === 'CALL' || config.direction === 'PUT')
  );
}

export function isValidRiskConfig(config: RiskConfig): boolean {
  return (
    Number.isFinite(config.maxOrderPct) &&
    config.maxOrderPct > 0 &&
    config.maxOrderPct <= 100 &&
    Number.isFinite(config.dailyStopPct) &&
    config.dailyStopPct > 0 &&
    config.dailyStopPct <= 100
  );
}