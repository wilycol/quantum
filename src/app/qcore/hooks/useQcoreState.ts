// src/app/qcore/hooks/useQcoreState.ts
// Zustand store for QuantumCore v2 state management

import { create } from 'zustand';
import { 
  QcoreState, 
  Broker, 
  Strategy, 
  Mode, 
  GridConfig, 
  BinaryConfig, 
  RiskConfig, 
  KPIs,
  LogEntry,
  TimelineEntry,
  isValidGridConfig,
  isValidBinaryConfig,
  isValidRiskConfig
} from '../lib/types';

// Initial state
const initialState: QcoreState = {
  // Core settings
  broker: 'binance',
  strategy: 'grid',
  mode: 'shadow',
  assets: ['BTCUSDT', 'ETHUSDT'],
  volumeOn: true,
  
  // Configurations
  grid: { size: 7, lower: 11000, upper: 11400, stepPct: 0.4 },
  binary: { amount: 50, expiry: 60, direction: 'CALL' },
  risk: { maxOrderPct: 5, dailyStopPct: 10 },
  
  // KPIs
  kpis: { elapsed: 0, balance: 10000, pnl: 0, trades: 0, winRate: 0 },
  
  // WebSocket status
  wsStatus: 'disconnected',
  connected: false,
  
  // Kill switch
  killSwitchActive: false,
  
  // Logs
  logs: [],
  
  // Timeline
  timeline: []
};

// Store actions interface
interface QcoreActions {
  // Broker and strategy
  setBroker: (broker: Broker) => void;
  setStrategy: (strategy: Strategy) => void;
  setMode: (mode: Mode) => void;
  
  // Assets and volume
  setAssets: (assets: string[]) => void;
  setVolumeOn: (volumeOn: boolean) => void;
  
  // Configurations
  setGrid: (grid: GridConfig) => void;
  setBinary: (binary: BinaryConfig) => void;
  setRisk: (risk: RiskConfig) => void;
  
  // KPIs
  updateKPIs: (updates: Partial<KPIs>) => void;
  resetKPIs: () => void;
  
  // WebSocket
  setWsStatus: (status: 'disconnected' | 'connecting' | 'connected') => void;
  setConnected: (broker: Broker, connected: boolean) => void;
  
  // Kill switch
  setKillSwitchActive: (active: boolean) => void;
  
  // Logs
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  
  // Timeline
  addTimelineEntry: (entry: TimelineEntry) => void;
  clearTimeline: () => void;
  
  // Reset
  reset: () => void;
}

// Create store
export const useQcoreState = create<QcoreState & QcoreActions>((set, get) => ({
  ...initialState,
  
  // Broker and strategy
  setBroker: (broker: Broker) => {
    const state = get();
    
    // Auto-set strategy based on broker
    let strategy: Strategy = 'grid';
    let assets = state.assets;
    
    if (broker === 'binance') {
      strategy = 'grid';
      assets = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'];
    } else if (broker === 'zaffer') {
      strategy = 'binary';
      assets = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'];
    }
    
    set({ 
      broker, 
      strategy, 
      assets,
      // Reset mode to shadow when changing broker
      mode: 'shadow'
    });
  },
  
  setStrategy: (strategy: Strategy) => {
    set({ strategy });
  },
  
  setMode: (mode: Mode) => {
    set({ mode });
  },
  
  // Assets and volume
  setAssets: (assets: string[]) => {
    set({ assets });
  },
  
  setVolumeOn: (volumeOn: boolean) => {
    set({ volumeOn });
  },
  
  // Configurations
  setGrid: (grid: GridConfig) => {
    if (isValidGridConfig(grid)) {
      set({ grid });
    } else {
      console.warn('Invalid grid configuration:', grid);
    }
  },
  
  setBinary: (binary: BinaryConfig) => {
    if (isValidBinaryConfig(binary)) {
      set({ binary });
    } else {
      console.warn('Invalid binary configuration:', binary);
    }
  },
  
  setRisk: (risk: RiskConfig) => {
    if (isValidRiskConfig(risk)) {
      set({ risk });
    } else {
      console.warn('Invalid risk configuration:', risk);
    }
  },
  
  // KPIs
  updateKPIs: (updates: Partial<KPIs>) => {
    set(state => ({
      kpis: { ...state.kpis, ...updates }
    }));
  },
  
  resetKPIs: () => {
    set({ kpis: initialState.kpis });
  },
  
  // WebSocket
  setWsStatus: (wsStatus: 'disconnected' | 'connecting' | 'connected') => {
    set({ wsStatus });
  },
  
  setConnected: (broker: Broker, connected: boolean) => {
    set({ connected });
  },
  
  // Kill switch
  setKillSwitchActive: (killSwitchActive: boolean) => {
    set({ killSwitchActive });
  },
  
  // Logs
  addLog: (log: LogEntry) => {
    set(state => ({
      logs: [...state.logs.slice(-99), log] // Keep last 100 logs
    }));
  },
  
  clearLogs: () => {
    set({ logs: [] });
  },
  
  // Timeline
  addTimelineEntry: (entry: TimelineEntry) => {
    set(state => ({
      timeline: [...state.timeline.slice(-49), entry] // Keep last 50 entries
    }));
  },
  
  clearTimeline: () => {
    set({ timeline: [] });
  },
  
  // Reset
  reset: () => {
    set(initialState);
  }
}));

// Selector hooks for better performance
export const useBroker = () => useQcoreState(state => state.broker);
export const useStrategy = () => useQcoreState(state => state.strategy);
export const useMode = () => useQcoreState(state => state.mode);
export const useAssets = () => useQcoreState(state => state.assets);
export const useVolumeOn = () => useQcoreState(state => state.volumeOn);
export const useGrid = () => useQcoreState(state => state.grid);
export const useBinary = () => useQcoreState(state => state.binary);
export const useRisk = () => useQcoreState(state => state.risk);
export const useKPIs = () => useQcoreState(state => state.kpis);
export const useWsStatus = () => useQcoreState(state => state.wsStatus);
export const useConnected = () => useQcoreState(state => state.connected);
export const useKillSwitchActive = () => useQcoreState(state => state.killSwitchActive);
export const useLogs = () => useQcoreState(state => state.logs);
export const useTimeline = () => useQcoreState(state => state.timeline);

// Action hooks
export const useQcoreActions = () => useQcoreState(state => ({
  setBroker: state.setBroker,
  setStrategy: state.setStrategy,
  setMode: state.setMode,
  setAssets: state.setAssets,
  setVolumeOn: state.setVolumeOn,
  setGrid: state.setGrid,
  setBinary: state.setBinary,
  setRisk: state.setRisk,
  updateKPIs: state.updateKPIs,
  resetKPIs: state.resetKPIs,
  setWsStatus: state.setWsStatus,
  setConnected: state.setConnected,
  setKillSwitchActive: state.setKillSwitchActive,
  addLog: state.addLog,
  clearLogs: state.clearLogs,
  addTimelineEntry: state.addTimelineEntry,
  clearTimeline: state.clearTimeline,
  reset: state.reset
}));