import { create } from 'zustand';

export type RiskLevel = 'low' | 'medium' | 'high' | 'custom';

export type RiskLimits = {
  maxTradePercent: number;      // % máximo por trade
  maxDailyPercent: number;      // % máximo diario
  maxOpenPositions: number;     // Máximo de posiciones abiertas
  stopLossPercent: number;      // % de stop loss
  takeProfitPercent: number;    // % de take profit
};

export type RiskState = {
  level: RiskLevel;
  limits: RiskLimits;
  dailyPnL: number;
  dailyVolume: number;
  openPositions: number;
  killSwitch: boolean;
  whitelist: string[];
  setLevel: (level: RiskLevel) => void;
  setLimits: (limits: Partial<RiskLimits>) => void;
  updateDailyStats: (pnl: number, volume: number) => void;
  setOpenPositions: (count: number) => void;
  toggleKillSwitch: () => void;
  addToWhitelist: (symbol: string) => void;
  removeFromWhitelist: (symbol: string) => void;
  canTrade: (symbol: string, amount: number) => { allowed: boolean; reason?: string };
};

const defaultLimits: Record<RiskLevel, RiskLimits> = {
  low: {
    maxTradePercent: 1,
    maxDailyPercent: 5,
    maxOpenPositions: 3,
    stopLossPercent: 2,
    takeProfitPercent: 3,
  },
  medium: {
    maxTradePercent: 2,
    maxDailyPercent: 10,
    maxOpenPositions: 5,
    stopLossPercent: 3,
    takeProfitPercent: 5,
  },
  high: {
    maxTradePercent: 5,
    maxDailyPercent: 20,
    maxOpenPositions: 10,
    stopLossPercent: 5,
    takeProfitPercent: 8,
  },
  custom: {
    maxTradePercent: 1,
    maxDailyPercent: 5,
    maxOpenPositions: 3,
    stopLossPercent: 2,
    takeProfitPercent: 3,
  },
};

export const useRisk = create<RiskState>((set, get) => ({
  level: 'medium',
  limits: defaultLimits.medium,
  dailyPnL: 0,
  dailyVolume: 0,
  openPositions: 0,
  killSwitch: false,
  whitelist: ['BTCUSDT', 'ETHUSDT'],

  setLevel: (level: RiskLevel) => {
    set({ level, limits: defaultLimits[level] });
  },

  setLimits: (newLimits: Partial<RiskLimits>) => {
    set(state => ({
      limits: { ...state.limits, ...newLimits },
      level: 'custom'
    }));
  },

  updateDailyStats: (pnl: number, volume: number) => {
    set({ dailyPnL: pnl, dailyVolume: volume });
  },

  setOpenPositions: (count: number) => {
    set({ openPositions: count });
  },

  toggleKillSwitch: () => {
    set(state => ({ killSwitch: !state.killSwitch }));
  },

  addToWhitelist: (symbol: string) => {
    set(state => ({
      whitelist: [...state.whitelist, symbol.toUpperCase()]
    }));
  },

  removeFromWhitelist: (symbol: string) => {
    set(state => ({
      whitelist: state.whitelist.filter(s => s !== symbol.toUpperCase())
    }));
  },

  canTrade: (symbol: string, amount: number) => {
    const state = get();
    
    // Kill switch activado
    if (state.killSwitch) {
      return { allowed: false, reason: 'Kill switch is active' };
    }

    // Símbolo no en whitelist
    if (!state.whitelist.includes(symbol.toUpperCase())) {
      return { allowed: false, reason: 'Symbol not in whitelist' };
    }

    // Máximo de posiciones abiertas
    if (state.openPositions >= state.limits.maxOpenPositions) {
      return { allowed: false, reason: 'Maximum open positions reached' };
    }

    // % máximo por trade (asumiendo balance de $10,000)
    const balance = 10000; // TODO: obtener del portfolio real
    const tradePercent = (amount / balance) * 100;
    if (tradePercent > state.limits.maxTradePercent) {
      return { allowed: false, reason: `Trade amount exceeds ${state.limits.maxTradePercent}% limit` };
    }

    // % máximo diario
    const dailyPercent = Math.abs(state.dailyPnL / balance) * 100;
    if (dailyPercent > state.limits.maxDailyPercent) {
      return { allowed: false, reason: `Daily loss exceeds ${state.limits.maxDailyPercent}% limit` };
    }

    return { allowed: true };
  },
}));
