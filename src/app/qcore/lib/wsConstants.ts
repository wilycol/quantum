// src/app/qcore/lib/wsConstants.ts
// WebSocket constants and event definitions for QuantumCore v2

import { PreviewEvent, ExecutedEvent, WsEvent } from './types';

// WebSocket connection constants
export const WS_CONFIG = {
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT_ATTEMPTS: 10,
  HEARTBEAT_INTERVAL: 30000,
  PING_TIMEOUT: 10000
};

// Event type constants
export const EVENT_TYPES = {
  PREVIEW: 'preview',
  EXECUTED: 'executed',
  BINARY_PREVIEW: 'binary_preview',
  BINARY_EXECUTED: 'binary_executed',
  STATE: 'state',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected'
} as const;

// Broker constants
export const BROKERS = {
  BINANCE: 'binance',
  ZAFFER: 'zaffer'
} as const;

// Strategy constants
export const STRATEGIES = {
  GRID: 'grid',
  BINARY: 'binary'
} as const;

// Mode constants
export const MODES = {
  SHADOW: 'shadow',
  LIVE: 'live'
} as const;

// Binary direction constants
export const BINARY_DIRECTIONS = {
  CALL: 'CALL',
  PUT: 'PUT'
} as const;

// Binary result constants
export const BINARY_RESULTS = {
  WIN: 'WIN',
  LOSE: 'LOSE',
  PENDING: 'PENDING'
} as const;

// Log level constants
export const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
} as const;

// WebSocket message wrapper
export interface WSMessage {
  type: string;
  data?: any;
  timestamp: number;
  id?: string;
}

// Event factory functions
export const createPreviewEvent = (
  broker: 'binance' | 'zaffer',
  pair: string,
  side: 'BUY' | 'SELL',
  price: number,
  conf: number,
  sl?: number,
  tp?: number
): PreviewEvent => ({
  t: 'preview',
  broker,
  pair,
  side,
  price,
  sl,
  tp,
  rr: sl && tp ? Math.abs((tp - price) / (price - sl)) : undefined,
  conf,
  ts: Date.now()
});

export const createBinaryPreviewEvent = (
  broker: 'zaffer',
  asset: string,
  dir: 'CALL' | 'PUT',
  strike: number,
  expiry: number,
  amount: number,
  conf: number
): PreviewEvent => ({
  t: 'preview',
  broker,
  asset,
  dir,
  strike,
  expiry,
  amount,
  conf,
  ts: Date.now()
});

export const createExecutedEvent = (
  orderId: string,
  pair: string,
  side: 'BUY' | 'SELL',
  fillPrice: number,
  qty: number,
  pnl?: number,
  sl?: number,
  tp?: number
): ExecutedEvent => ({
  t: 'executed',
  orderId,
  pair,
  side,
  fillPrice,
  qty,
  sl,
  tp,
  pnl,
  ts: Date.now()
});

export const createBinaryExecutedEvent = (
  ticketId: string,
  asset: string,
  result: 'WIN' | 'LOSE' | 'PENDING',
  amount: number,
  payout: number,
  net: number
): ExecutedEvent => ({
  t: 'binary_executed',
  ticketId,
  asset,
  result,
  amount,
  payout,
  net,
  ts: Date.now()
});

// Event validation
export function isValidEvent(event: any): event is WsEvent {
  return (
    event &&
    typeof event === 'object' &&
    typeof event.t === 'string' &&
    typeof event.ts === 'number' &&
    ['preview', 'executed', 'binary_preview', 'binary_executed'].includes(event.t)
  );
}

// Event type guards
export function isPreviewEvent(event: WsEvent): event is PreviewEvent {
  return event.t === 'preview';
}

export function isExecutedEvent(event: WsEvent): event is ExecutedEvent {
  return event.t === 'executed' || event.t === 'binary_executed';
}

export function isBinaryEvent(event: WsEvent): boolean {
  return event.t === 'binary_preview' || event.t === 'binary_executed';
}

export function isSpotEvent(event: WsEvent): boolean {
  return event.t === 'preview' || event.t === 'executed';
}

// Event routing helpers
export function getEventBroker(event: WsEvent): 'binance' | 'zaffer' | undefined {
  return event.broker;
}

export function getEventSymbol(event: WsEvent): string | undefined {
  return event.pair || event.asset;
}

export function getEventSide(event: WsEvent): 'BUY' | 'SELL' | 'CALL' | 'PUT' | undefined {
  return event.side || event.dir;
}

export function getEventPrice(event: WsEvent): number | undefined {
  return event.price || event.strike || event.fillPrice;
}

// Error codes
export const ERROR_CODES = {
  WS_CONNECTION_FAILED: 'WS_CONNECTION_FAILED',
  WS_MESSAGE_INVALID: 'WS_MESSAGE_INVALID',
  WS_RECONNECT_FAILED: 'WS_RECONNECT_FAILED',
  WS_PING_TIMEOUT: 'WS_PING_TIMEOUT',
  EVENT_VALIDATION_FAILED: 'EVENT_VALIDATION_FAILED',
  BROKER_CONNECTION_FAILED: 'BROKER_CONNECTION_FAILED',
  RISK_LIMIT_EXCEEDED: 'RISK_LIMIT_EXCEEDED',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION'
} as const;

// Error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.WS_CONNECTION_FAILED]: 'WebSocket connection failed',
  [ERROR_CODES.WS_MESSAGE_INVALID]: 'Invalid WebSocket message format',
  [ERROR_CODES.WS_RECONNECT_FAILED]: 'WebSocket reconnection failed',
  [ERROR_CODES.WS_PING_TIMEOUT]: 'WebSocket ping timeout',
  [ERROR_CODES.EVENT_VALIDATION_FAILED]: 'Event validation failed',
  [ERROR_CODES.BROKER_CONNECTION_FAILED]: 'Broker connection failed',
  [ERROR_CODES.RISK_LIMIT_EXCEEDED]: 'Risk limit exceeded',
  [ERROR_CODES.INVALID_CONFIGURATION]: 'Invalid configuration'
} as const;

// WebSocket URL construction
export function buildWsUrl(baseUrl: string, path: string = '/qcore'): string {
  const protocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
  const cleanUrl = baseUrl.replace(/^https?:\/\//, '');
  return `${protocol}://${cleanUrl}${path}`;
}

// Default WebSocket URL
export const DEFAULT_WS_URL = (() => {
  // Check for Vite environment variable
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // Default to localhost for development
  return 'ws://localhost:8080/qcore';
})();

// Event subscription helpers
export function createEventSubscription(
  eventType: string,
  callback: (event: WsEvent) => void
): { unsubscribe: () => void } {
  // This would be implemented in the WebSocket hook
  return {
    unsubscribe: () => {
      // Unsubscribe logic
    }
  };
}

// Event filtering helpers
export function filterEventsByBroker(events: WsEvent[], broker: 'binance' | 'zaffer'): WsEvent[] {
  return events.filter(event => event.broker === broker);
}

export function filterEventsBySymbol(events: WsEvent[], symbol: string): WsEvent[] {
  return events.filter(event => (event.pair || event.asset) === symbol);
}

export function filterEventsByType(events: WsEvent[], type: string): WsEvent[] {
  return events.filter(event => event.t === type);
}

// Event aggregation helpers
export function aggregateEventsBySymbol(events: WsEvent[]): Record<string, WsEvent[]> {
  return events.reduce((acc, event) => {
    const symbol = event.pair || event.asset;
    if (symbol) {
      if (!acc[symbol]) acc[symbol] = [];
      acc[symbol].push(event);
    }
    return acc;
  }, {} as Record<string, WsEvent[]>);
}

export function getLatestEventBySymbol(events: WsEvent[]): Record<string, WsEvent> {
  const latest: Record<string, WsEvent> = {};
  
  events.forEach(event => {
    const symbol = event.pair || event.asset;
    if (symbol) {
      if (!latest[symbol] || event.ts > latest[symbol].ts) {
        latest[symbol] = event;
      }
    }
  });
  
  return latest;
}
