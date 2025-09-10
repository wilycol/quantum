// src/services/eventBus.ts
// QuantumCore Event Bus WebSocket Service

import { 
  IncomingEvent, 
  OutgoingEvent, 
  WSMessage, 
  EventBusConfig,
  PreviewEvent,
  BinaryPreviewEvent,
  ExecutedEvent,
  BinaryExecutedEvent,
  StateEvent
} from '../types/eventBus';

export class EventBus {
  private ws: WebSocket | null = null;
  private config: EventBusConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private messageId = 0;

  // Event listeners
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = {
      url: config.url || (() => {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          return null; // SSR - no WebSocket
        }
        
        const WS_URL = import.meta.env.VITE_WS_URL;
        
        // If no WS_URL defined, use appropriate endpoint
        if (!WS_URL) {
          if (window.location.hostname !== 'localhost') {
            // In production, use the Vercel WebSocket endpoint
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            return `${protocol}//${window.location.host}/api/ws`;
          }
          return 'ws://localhost:8080/ws'; // Enable EventBus in localhost
        }
        
        // If WS_URL contains localhost but we're not on localhost, disable
        if (WS_URL.includes('localhost') && window.location.hostname !== 'localhost') {
          console.warn('WS: localhost URL detected in production, disabling WebSocket');
          return null;
        }
        
        // If site runs on HTTPS, ensure WS is WSS
        if (window.location.protocol === 'https:' && WS_URL.startsWith('ws://')) {
          console.warn('WS: HTTPS site with WS URL, should use WSS');
          return null;
        }
        
        return WS_URL;
      })(),
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5, // Reduced to 5
      heartbeatInterval: config.heartbeatInterval || 30000,
      debug: config.debug || false,
    };
  }

  // Connect to WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If no URL configured, reject connection
      if (!this.config.url) {
        console.log('[EventBus] No WebSocket URL configured');
        reject(new Error('WebSocket URL not configured'));
        return;
      }

      console.log('[EventBus] Attempting to connect to:', this.config.url);
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.log('Connected to Event Bus');
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            this.log('Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;
          this.stopHeartbeat();
          this.log('WebSocket closed:', event.code, event.reason);
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          // Close permanently on error codes 1006/1005
          if (event.code === 1006 || event.code === 1005) {
            this.log('WebSocket closed permanently due to error code:', event.code);
            this.reconnectAttempts = this.config.maxReconnectAttempts; // Prevent reconnection
            return;
          }
          
          if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.log('Disconnected from Event Bus');
  }

  // Send state to app
  sendState(state: StateEvent): void {
    const message: WSMessage = {
      type: 'state',
      data: state,
      timestamp: Date.now(),
      id: `state_${++this.messageId}`
    };
    
    this.send(message);
  }

  // Send preview event
  sendPreview(event: PreviewEvent | BinaryPreviewEvent): void {
    const message: WSMessage = {
      type: 'event',
      data: event,
      timestamp: Date.now(),
      id: `preview_${++this.messageId}`
    };
    
    this.send(message);
  }

  // Send executed event
  sendExecuted(event: ExecutedEvent | BinaryExecutedEvent): void {
    const message: WSMessage = {
      type: 'event',
      data: event,
      timestamp: Date.now(),
      id: `executed_${++this.messageId}`
    };
    
    this.send(message);
  }

  // Subscribe to events
  on(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  // Emit event to listeners
  private emit(eventType: string, data?: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.log('Error in event listener:', error);
        }
      });
    }
  }

  // Send message through WebSocket
  private send(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.log('Sent message:', message);
    } else {
      this.log('WebSocket not connected, cannot send message:', message);
    }
  }

  // Handle incoming messages
  private handleMessage(message: WSMessage): void {
    this.log('Received message:', message);
    
    switch (message.type) {
      case 'event':
        if (message.data) {
          const event = message.data as IncomingEvent;
          this.emit(`event:${event.t}`, event);
          this.emit('event', event);
        }
        break;
        
      case 'state':
        if (message.data) {
          const state = message.data as StateEvent;
          this.emit('state', state);
        }
        break;
        
      case 'pong':
        this.log('Received pong');
        break;
        
      case 'error':
        this.emit('error', message.data);
        break;
        
      default:
        this.log('Unknown message type:', message.type);
    }
  }

  // Start heartbeat
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'ping',
          timestamp: Date.now()
        });
      }
    }, this.config.heartbeatInterval);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Schedule reconnection
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    
    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.log(`Reconnect attempt ${this.reconnectAttempts}`);
      this.connect().catch(error => {
        this.log('Reconnect failed:', error);
      });
    }, delay);
  }

  // Clear reconnect timer
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Logging
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[EventBus]', ...args);
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get connectionState(): number {
    return this.ws?.readyState || WebSocket.CLOSED;
  }
}

// Singleton instance
let eventBusInstance: EventBus | null = null;

export function getEventBus(config?: Partial<EventBusConfig>): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(config);
  }
  return eventBusInstance;
}

// Helper functions for creating events
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
  asset: string,
  dir: 'CALL' | 'PUT',
  strike: number,
  expiry: number,
  amount: number,
  payout: number,
  conf: number
): BinaryPreviewEvent => ({
  t: 'binary_preview',
  asset,
  dir,
  strike,
  expiry,
  amount,
  payout,
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
  result: 'WIN' | 'LOSE' | 'PENDING',
  amount: number,
  payout: number,
  net: number
): BinaryExecutedEvent => ({
  t: 'binary_executed',
  ticketId,
  result,
  amount,
  payout,
  net,
  ts: Date.now()
});

export const createStateEvent = (
  broker: 'binance' | 'zaffer',
  mode: 'shadow' | 'live',
  assets: string[],
  volumeOn: boolean,
  risk: { maxOrderPct: number; dailyStopPct: number },
  grid: { size: number; lower: number; upper: number; stepPct: number },
  binary: { amount: number; expiry: number; direction: 'CALL' | 'PUT' }
): StateEvent => ({
  broker,
  mode,
  assets,
  volumeOn,
  risk,
  grid,
  binary
});
