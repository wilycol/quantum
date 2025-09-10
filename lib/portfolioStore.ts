import { create } from 'zustand';

export type Position = {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
  stopLoss?: number;
  takeProfit?: number;
};

export type Trade = {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  amount: number;
  price: number;
  pnl: number;
  timestamp: number;
  status: 'open' | 'closed';
};

export type PortfolioState = {
  balance: number;
  positions: Position[];
  trades: Trade[];
  totalPnL: number;
  dailyPnL: number;
  totalVolume: number;
  dailyVolume: number;
  addPosition: (position: Omit<Position, 'id' | 'pnl' | 'pnlPercent' | 'timestamp'>) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string, exitPrice: number) => void;
  addTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => void;
  updateBalance: (amount: number) => void;
  resetDaily: () => void;
  getPositionById: (id: string) => Position | undefined;
  getPositionsBySymbol: (symbol: string) => Position[];
  calculateTotalPnL: () => number;
};

export const usePortfolio = create<PortfolioState>((set, get) => ({
  balance: 10000,
  positions: [],
  trades: [],
  totalPnL: 0,
  dailyPnL: 0,
  totalVolume: 0,
  dailyVolume: 0,

  addPosition: (positionData) => {
    const id = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const position: Position = {
      ...positionData,
      id,
      pnl: 0,
      pnlPercent: 0,
      timestamp: Date.now(),
    };
    
    set(state => ({
      positions: [...state.positions, position]
    }));
  },

  updatePosition: (id: string, updates: Partial<Position>) => {
    set(state => ({
      positions: state.positions.map(pos => 
        pos.id === id ? { ...pos, ...updates } : pos
      )
    }));
  },

  closePosition: (id: string, exitPrice: number) => {
    const state = get();
    const position = state.positions.find(p => p.id === id);
    if (!position) return;

    const pnl = position.side === 'long' 
      ? (exitPrice - position.entryPrice) * position.amount
      : (position.entryPrice - exitPrice) * position.amount;

    // Agregar trade cerrado
    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: position.symbol,
      side: position.side,
      amount: position.amount,
      price: exitPrice,
      pnl,
      timestamp: Date.now(),
      status: 'closed',
    };

    set(state => ({
      positions: state.positions.filter(p => p.id !== id),
      trades: [...state.trades, trade],
      balance: state.balance + pnl,
      dailyPnL: state.dailyPnL + pnl,
      totalPnL: state.totalPnL + pnl,
    }));
  },

  addTrade: (tradeData) => {
    const id = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const trade: Trade = {
      ...tradeData,
      id,
      timestamp: Date.now(),
    };
    
    set(state => ({
      trades: [...state.trades, trade],
      dailyVolume: state.dailyVolume + (trade.amount * trade.price),
      totalVolume: state.totalVolume + (trade.amount * trade.price),
    }));
  },

  updateBalance: (amount: number) => {
    set({ balance: amount });
  },

  resetDaily: () => {
    set({ dailyPnL: 0, dailyVolume: 0 });
  },

  getPositionById: (id: string) => {
    return get().positions.find(p => p.id === id);
  },

  getPositionsBySymbol: (symbol: string) => {
    return get().positions.filter(p => p.symbol === symbol);
  },

  calculateTotalPnL: () => {
    const state = get();
    const openPnL = state.positions.reduce((sum, pos) => {
      const currentPnL = pos.side === 'long' 
        ? (pos.currentPrice - pos.entryPrice) * pos.amount
        : (pos.entryPrice - pos.currentPrice) * pos.amount;
      return sum + currentPnL;
    }, 0);
    
    return state.totalPnL + openPnL;
  },
}));
