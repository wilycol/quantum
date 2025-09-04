import { Tick, Trade, State, SimulatorOptions } from './types';
import { rsi, getSignal } from './strategy';

export class TradingSimulator {
  private options: SimulatorOptions;
  private state: State;
  private intervalId: NodeJS.Timeout | null = null;
  private currentPrice: number;
  private tickCount: number = 0;

  constructor(options: SimulatorOptions = {}) {
    this.options = {
      tickInterval: 1000, // 1 segundo por defecto
      initialPrice: 100,
      volatility: 0.02, // 2% de volatilidad
      trend: 'sideways',
      ...options
    };

    this.currentPrice = this.options.initialPrice!;
    
    this.state = {
      closes: [this.currentPrice],
      lastPrice: this.currentPrice,
      rsi: null,
      side: 'hold',
      trades: [],
      pnl: 0,
      isActive: false
    };
  }

  /**
   * Genera un nuevo tick de precio
   */
  generateTick(): Tick {
    this.tickCount++;
    
    // Calcular nuevo precio con volatilidad y tendencia
    let change = (Math.random() - 0.5) * this.options.volatility! * this.currentPrice;
    
    // Aplicar tendencia si está configurada
    if (this.options.trend === 'up') {
      change += this.options.volatility! * this.currentPrice * 0.1;
    } else if (this.options.trend === 'down') {
      change -= this.options.volatility! * this.currentPrice * 0.1;
    }
    
    const newPrice = Math.max(this.currentPrice + change, 0.01); // Precio mínimo 0.01
    
    const tick: Tick = {
      time: new Date(),
      open: this.currentPrice,
      high: Math.max(this.currentPrice, newPrice),
      low: Math.min(this.currentPrice, newPrice),
      close: newPrice,
      volume: Math.floor(Math.random() * 1000) + 100
    };
    
    this.currentPrice = newPrice;
    this.state.lastPrice = newPrice;
    this.state.closes.push(newPrice);
    
    // Mantener solo los últimos 100 precios para el RSI
    if (this.state.closes.length > 100) {
      this.state.closes.shift();
    }
    
    // Actualizar RSI y señal
    this.state.rsi = rsi(this.state.closes);
    this.state.side = getSignal(this.state.closes);
    
    return tick;
  }

  /**
   * Aplica un trade simulado
   */
  applyTrade(tradeData: { side: 'buy' | 'sell'; qty: number; price: number }): Trade {
    const fee = tradeData.price * tradeData.qty * 0.001; // 0.1% de fee
    const total = tradeData.price * tradeData.qty + fee;
    
    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      time: new Date(),
      side: tradeData.side,
      qty: tradeData.qty,
      price: tradeData.price,
      fee: fee,
      total: total
    };
    
    this.state.trades.push(trade);
    
    // Calcular PnL simple (para demo)
    if (tradeData.side === 'sell') {
      // Si vendemos, asumimos que compramos antes a un precio menor
      const avgBuyPrice = this.state.trades
        .filter(t => t.side === 'buy')
        .reduce((sum, t) => sum + t.price * t.qty, 0) / 
        this.state.trades.filter(t => t.side === 'buy').reduce((sum, t) => sum + t.qty, 0);
      
      if (avgBuyPrice > 0) {
        this.state.pnl += (tradeData.price - avgBuyPrice) * tradeData.qty - fee;
      }
    }
    
    return trade;
  }

  /**
   * Obtiene el estado actual del simulador
   */
  getState(): State {
    return { ...this.state };
  }

  /**
   * Inicia el simulador
   */
  start(): void {
    if (this.state.isActive) return;
    
    this.state.isActive = true;
    this.intervalId = setInterval(() => {
      this.generateTick();
    }, this.options.tickInterval);
  }

  /**
   * Detiene el simulador
   */
  stop(): void {
    if (!this.state.isActive) return;
    
    this.state.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Reinicia el simulador
   */
  reset(): void {
    this.stop();
    this.currentPrice = this.options.initialPrice!;
    this.tickCount = 0;
    
    this.state = {
      closes: [this.currentPrice],
      lastPrice: this.currentPrice,
      rsi: null,
      side: 'hold',
      trades: [],
      pnl: 0,
      isActive: false
    };
  }

  /**
   * Destruye el simulador
   */
  destroy(): void {
    this.stop();
  }
}

/**
 * Factory function para crear un simulador
 */
export function createSimulator(options: SimulatorOptions = {}): TradingSimulator {
  return new TradingSimulator(options);
}
