// src/lib/datasetCollector.ts
// Dataset collection system for training data

export interface EventData {
  ts: number;
  type: string;
  symbol?: string;
  interval?: string;
  payload: any;
  session_id: string;
  mode: 'shadow' | 'live';
}

export interface KlineData {
  ts_open: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  symbol: string;
  interval: string;
}

export interface OrderData {
  order_id: string;
  ts_accepted: number;
  ts_filled?: number;
  side: 'BUY' | 'SELL';
  price_accepted: number;
  price_filled?: number;
  qty: number;
  amount_usd: number;
  status: 'accepted' | 'partial' | 'filled' | 'rejected' | 'expired';
  pnl?: number;
  pnl_pct?: number;
  reason_reject?: string;
}

export interface RiskCheckData {
  ts: number;
  decision: 'ok' | 'reject';
  code: string;
  inputs: any;
}

export interface Sample5M {
  symbol: string;
  ts: number;
  horizon: '5m' | '15m' | '30m';
  
  // Market features
  ret_1m: number;
  ret_3m: number;
  ret_5m: number;
  rsi_14: number;
  stoch_k: number;
  stoch_d: number;
  atr_14: number;
  bb_width: number;
  vol_sma_ratio: number;
  grid_pos: number;
  
  // Bot context
  exposure_pct_today: number;
  open_trades: number;
  mode: 'shadow' | 'live';
  risk_preset: 'low' | 'medium' | 'high' | 'custom';
  is_symbol_whitelisted: boolean;
  
  // Signal
  hint_side: 'call' | 'put' | 'buy' | 'sell' | 'none';
  signal_strength: number;
  latency_ms: number;
  
  // Labels
  target_ret_5m?: number;
  target_hit_tp_sl?: 'tp' | 'sl' | 'none';
  is_profitable_5m?: boolean;
  
  // Weights
  sample_weight?: number;
}

class DatasetCollector {
  private events: EventData[] = [];
  private klines: KlineData[] = [];
  private orders: OrderData[] = [];
  private riskChecks: RiskCheckData[] = [];
  private samples: Sample5M[] = [];
  
  private sessionId: string;
  private maxEvents = 10000; // Memory limit
  private maxKlines = 5000;
  private maxOrders = 1000;
  private maxRiskChecks = 1000;
  private maxSamples = 2000;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `qc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event collection
  collectEvent(type: string, payload: any, symbol?: string, interval?: string, mode: 'shadow' | 'live' = 'shadow') {
    const event: EventData = {
      ts: Date.now(),
      type,
      symbol,
      interval,
      payload,
      session_id: this.sessionId,
      mode
    };

    this.events.push(event);
    
    // Memory management
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Emit to EventBus for real-time monitoring
    this.emitToEventBus('dataset:event_collected', { event });
  }

  // Kline collection
  collectKline(kline: KlineData) {
    this.klines.push(kline);
    
    if (this.klines.length > this.maxKlines) {
      this.klines = this.klines.slice(-this.maxKlines);
    }
  }

  // Order collection
  collectOrder(order: OrderData) {
    this.orders.push(order);
    
    if (this.orders.length > this.maxOrders) {
      this.orders = this.orders.slice(-this.maxOrders);
    }
  }

  // Risk check collection
  collectRiskCheck(riskCheck: RiskCheckData) {
    this.riskChecks.push(riskCheck);
    
    if (this.riskChecks.length > this.maxRiskChecks) {
      this.riskChecks = this.riskChecks.slice(-this.maxRiskChecks);
    }
  }

  // Sample generation (5-minute windows)
  generateSample5M(symbol: string, ts: number, horizon: '5m' | '15m' | '30m' = '5m'): Sample5M | null {
    // This would be implemented with actual technical analysis calculations
    // For now, return a mock sample
    const sample: Sample5M = {
      symbol,
      ts,
      horizon,
      
      // Mock market features
      ret_1m: Math.random() * 0.02 - 0.01, // -1% to +1%
      ret_3m: Math.random() * 0.04 - 0.02, // -2% to +2%
      ret_5m: Math.random() * 0.06 - 0.03, // -3% to +3%
      rsi_14: Math.random() * 100, // 0-100
      stoch_k: Math.random() * 100, // 0-100
      stoch_d: Math.random() * 100, // 0-100
      atr_14: Math.random() * 1000, // Mock ATR
      bb_width: Math.random() * 0.1, // 0-10%
      vol_sma_ratio: Math.random() * 2, // 0-200%
      grid_pos: Math.random(), // 0-1
      
      // Mock bot context
      exposure_pct_today: Math.random() * 0.1, // 0-10%
      open_trades: Math.floor(Math.random() * 5), // 0-4
      mode: 'shadow',
      risk_preset: 'medium',
      is_symbol_whitelisted: Math.random() > 0.5,
      
      // Mock signal
      hint_side: ['call', 'put', 'buy', 'sell', 'none'][Math.floor(Math.random() * 5)] as any,
      signal_strength: Math.random(), // 0-1
      latency_ms: Math.random() * 100, // 0-100ms
      
      // Mock labels
      target_ret_5m: Math.random() * 0.02 - 0.01,
      target_hit_tp_sl: ['tp', 'sl', 'none'][Math.floor(Math.random() * 3)] as any,
      is_profitable_5m: Math.random() > 0.5,
      
      sample_weight: Math.random()
    };

    this.samples.push(sample);
    
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }

    return sample;
  }

  // Data export
  exportEvents(): EventData[] {
    return [...this.events];
  }

  exportKlines(): KlineData[] {
    return [...this.klines];
  }

  exportOrders(): OrderData[] {
    return [...this.orders];
  }

  exportRiskChecks(): RiskCheckData[] {
    return [...this.riskChecks];
  }

  exportSamples(): Sample5M[] {
    return [...this.samples];
  }

  // Export all data
  exportAll() {
    return {
      events: this.exportEvents(),
      klines: this.exportKlines(),
      orders: this.exportOrders(),
      riskChecks: this.exportRiskChecks(),
      samples: this.exportSamples(),
      sessionId: this.sessionId,
      exportedAt: Date.now()
    };
  }

  // Clear data
  clear() {
    this.events = [];
    this.klines = [];
    this.orders = [];
    this.riskChecks = [];
    this.samples = [];
    this.sessionId = this.generateSessionId();
  }

  // Statistics
  getStats() {
    return {
      events: this.events.length,
      klines: this.klines.length,
      orders: this.orders.length,
      riskChecks: this.riskChecks.length,
      samples: this.samples.length,
      sessionId: this.sessionId
    };
  }

  // EventBus integration
  private emitToEventBus(type: string, data: any) {
    if (typeof window !== 'undefined' && (window as any).eventBus) {
      (window as any).eventBus.emit({ type, data, timestamp: Date.now() });
    }
  }

  // API integration for data collection
  async sendToAPI(endpoint: string = '/api/collect') {
    try {
      const data = this.exportAll();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('[DatasetCollector] Data sent to API successfully');
        return true;
      } else {
        console.error('[DatasetCollector] Failed to send data to API:', response.status);
        return false;
      }
    } catch (error) {
      console.error('[DatasetCollector] Error sending data to API:', error);
      return false;
    }
  }
}

// Export singleton instance
export const datasetCollector = new DatasetCollector();

// Helper functions for common event types
export const collectSignalPreview = (symbol: string, side: string, strength: number, ttl: number) => {
  datasetCollector.collectEvent('signal.preview', {
    pair: symbol,
    side,
    strength,
    ttl_ms: ttl,
    source: 'grid'
  }, symbol, undefined, 'shadow');
};

export const collectRiskDecision = (symbol: string, ok: boolean, code: string, context: any) => {
  datasetCollector.collectEvent('risk.decision', {
    ok,
    code,
    context
  }, symbol, undefined, 'shadow');
};

export const collectOrderAccepted = (orderId: string, symbol: string, side: string, price: number, qty: number) => {
  datasetCollector.collectEvent('order.accepted', {
    order_id: orderId,
    symbol,
    side,
    price,
    qty,
    amount_usd: price * qty,
    status: 'accepted'
  }, symbol, undefined, 'live');
};

export const collectOrderFilled = (orderId: string, symbol: string, price: number, qty: number, pnl: number) => {
  datasetCollector.collectEvent('order.filled', {
    order_id: orderId,
    symbol,
    price,
    qty,
    amount_usd: price * qty,
    status: 'filled',
    pnl
  }, symbol, undefined, 'live');
};
