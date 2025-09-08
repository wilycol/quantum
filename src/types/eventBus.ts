// src/types/eventBus.ts
// Event Bus Types for QuantumCore WebSocket Communication

export type BrokerType = 'binance' | 'zaffer';
export type ModeType = 'shadow' | 'live';
export type BinaryDirection = 'CALL' | 'PUT';
export type BinaryResult = 'WIN' | 'LOSE' | 'PENDING';

// Preview Events (app → panel)
export interface PreviewEvent {
  t: 'preview';
  broker: BrokerType;
  pair: string;
  side: 'BUY' | 'SELL';
  price: number;
  sl?: number;
  tp?: number;
  rr?: number;
  conf: number;
  ts: number;
}

export interface BinaryPreviewEvent {
  t: 'binary_preview';
  asset: string;
  dir: BinaryDirection;
  strike: number;
  expiry: number; // seconds
  amount: number;
  payout: number;
  conf: number;
  ts: number;
}

// Executed Events (app → panel)
export interface ExecutedEvent {
  t: 'executed';
  orderId: string;
  pair: string;
  side: 'BUY' | 'SELL';
  fillPrice: number;
  qty: number;
  sl?: number;
  tp?: number;
  pnl?: number;
  ts: number;
}

export interface BinaryExecutedEvent {
  t: 'binary_executed';
  ticketId: string;
  result: BinaryResult;
  amount: number;
  payout: number;
  net: number;
  ts: number;
}

// State Events (panel → app)
export interface StateEvent {
  broker: BrokerType;
  mode: ModeType;
  assets: string[];
  volumeOn: boolean;
  risk: {
    maxOrderPct: number;
    dailyStopPct: number;
  };
  grid: {
    size: number;
    lower: number;
    upper: number;
    stepPct: number;
  };
  binary: {
    amount: number;
    expiry: number;
    direction: BinaryDirection;
  };
}

// Union types for all events
export type IncomingEvent = PreviewEvent | BinaryPreviewEvent | ExecutedEvent | BinaryExecutedEvent;
export type OutgoingEvent = StateEvent;

// WebSocket message wrapper
export interface WSMessage {
  type: 'event' | 'state' | 'ping' | 'pong' | 'error';
  data?: IncomingEvent | OutgoingEvent;
  timestamp: number;
  id?: string;
}

// Event Bus configuration
export interface EventBusConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  debug: boolean;
}
