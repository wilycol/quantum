// src/app/qcore/hooks/useQcoreState.ts
// Global state management for QuantumCore v2 using Zustand

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  QcoreState, 
  Broker, 
  Mode, 
  Strategy,
  DEFAULT_RISK_CONFIG,
  DEFAULT_GRID_CONFIG,
  DEFAULT_BINARY_CONFIG,
  DEFAULT_KPIS,
  BINANCE_ASSETS,
  ZAFFER_ASSETS
} from '../lib/types';

// State interface with actions
interface QcoreActions {
  // Broker and strategy management
  setBroker: (broker: Broker) => void;
  setStrategy: (strategy: Strategy) => void;
  setMode: (mode: Mode) => void;
  
  // Asset management
  setAssets: (assets: string[]) => void;
  addAsset: (asset: string) => void;
  removeAsset: (asset: string) => void;
  
  // Configuration management
  setRisk: (risk: Partial<QcoreState['risk']>) => void;
  setGrid: (grid: Partial<QcoreState['grid']>) => void;
  setBinary: (binary: Partial<QcoreState['binary']>) => void;
  
  // Display settings
  setVolumeOn: (volumeOn: boolean) => void;
  
  // Connection management
  setConnected: (broker: Broker, connected: boolean) => void;
  setWsStatus: (status: QcoreState['wsStatus']) => void;
  
  // KPIs management
  setKPIs: (kpis: Partial<QcoreState['kpis']>) => void;
  updateKPIs: (updates: Partial<QcoreState['kpis']>) => void;
  
  // UI state management
  setKillSwitchActive: (active: boolean) => void;
  setShowModeConfirmModal: (show: boolean) => void;
  
  // Reset functions
  resetState: () => void;
  resetKPIs: () => void;
  resetConnections: () => void;
}

// Combined state and actions type
type QcoreStore = QcoreState & QcoreActions;

// Initial state
const initialState: QcoreState = {
  broker: 'binance',
  strategy: 'grid',
  mode: 'shadow',
  assets: ['BTCUSDT', 'ETHUSDT'],
  volumeOn: true,
  risk: DEFAULT_RISK_CONFIG,
  grid: DEFAULT_GRID_CONFIG,
  binary: DEFAULT_BINARY_CONFIG,
  kpis: DEFAULT_KPIS,
  connected: { binance: false, zaffer: false },
  wsStatus: 'disconnected',
  killSwitchActive: false,
  showModeConfirmModal: false
};

// Create the store
export const useQcoreState = create<QcoreStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // Broker and strategy management
    setBroker: (broker: Broker) => {
      const strategy: Strategy = broker === 'binance' ? 'grid' : 'binary';
      const availableAssets = broker === 'binance' 
        ? BINANCE_ASSETS.map(a => a.symbol)
        : ZAFFER_ASSETS.map(a => a.symbol);
      
      set({
        broker,
        strategy,
        assets: availableAssets.slice(0, 2), // Keep first 2 assets
        connected: { binance: false, zaffer: false } // Reset connections
      });
    },
    
    setStrategy: (strategy: Strategy) => {
      set({ strategy });
    },
    
    setMode: (mode: Mode) => {
      set({ mode });
    },
    
    // Asset management
    setAssets: (assets: string[]) => {
      set({ assets });
    },
    
    addAsset: (asset: string) => {
      const { assets } = get();
      if (!assets.includes(asset) && assets.length < 5) {
        set({ assets: [...assets, asset] });
      }
    },
    
    removeAsset: (asset: string) => {
      const { assets } = get();
      if (assets.length > 1) { // Keep at least one asset
        set({ assets: assets.filter(a => a !== asset) });
      }
    },
    
    // Configuration management
    setRisk: (risk) => {
      set(state => ({ risk: { ...state.risk, ...risk } }));
    },
    
    setGrid: (grid) => {
      set(state => ({ grid: { ...state.grid, ...grid } }));
    },
    
    setBinary: (binary) => {
      set(state => ({ binary: { ...state.binary, ...binary } }));
    },
    
    // Display settings
    setVolumeOn: (volumeOn: boolean) => {
      set({ volumeOn });
    },
    
    // Connection management
    setConnected: (broker: Broker, connected: boolean) => {
      set(state => ({
        connected: { ...state.connected, [broker]: connected }
      }));
    },
    
    setWsStatus: (wsStatus) => {
      set({ wsStatus });
    },
    
    // KPIs management
    setKPIs: (kpis) => {
      set(state => ({ kpis: { ...state.kpis, ...kpis } }));
    },
    
    updateKPIs: (updates) => {
      set(state => ({ kpis: { ...state.kpis, ...updates } }));
    },
    
    // UI state management
    setKillSwitchActive: (killSwitchActive: boolean) => {
      set({ killSwitchActive });
    },
    
    setShowModeConfirmModal: (showModeConfirmModal: boolean) => {
      set({ showModeConfirmModal });
    },
    
    // Reset functions
    resetState: () => {
      set(initialState);
    },
    
    resetKPIs: () => {
      set({ kpis: DEFAULT_KPIS });
    },
    
    resetConnections: () => {
      set({
        connected: { binance: false, zaffer: false },
        wsStatus: 'disconnected'
      });
    }
  }))
);

// Selector hooks for specific parts of state
export const useBroker = () => useQcoreState(state => state.broker);
export const useStrategy = () => useQcoreState(state => state.strategy);
export const useMode = () => useQcoreState(state => state.mode);
export const useAssets = () => useQcoreState(state => state.assets);
export const useVolumeOn = () => useQcoreState(state => state.volumeOn);
export const useRisk = () => useQcoreState(state => state.risk);
export const useGrid = () => useQcoreState(state => state.grid);
export const useBinary = () => useQcoreState(state => state.binary);
export const useKPIs = () => useQcoreState(state => state.kpis);
export const useConnected = () => useQcoreState(state => state.connected);
export const useWsStatus = () => useQcoreState(state => state.wsStatus);
export const useKillSwitchActive = () => useQcoreState(state => state.killSwitchActive);
export const useShowModeConfirmModal = () => useQcoreState(state => state.showModeConfirmModal);

// Action hooks
export const useQcoreActions = () => useQcoreState(state => ({
  setBroker: state.setBroker,
  setStrategy: state.setStrategy,
  setMode: state.setMode,
  setAssets: state.setAssets,
  addAsset: state.addAsset,
  removeAsset: state.removeAsset,
  setRisk: state.setRisk,
  setGrid: state.setGrid,
  setBinary: state.setBinary,
  setVolumeOn: state.setVolumeOn,
  setConnected: state.setConnected,
  setWsStatus: state.setWsStatus,
  setKPIs: state.setKPIs,
  updateKPIs: state.updateKPIs,
  setKillSwitchActive: state.setKillSwitchActive,
  setShowModeConfirmModal: state.setShowModeConfirmModal,
  resetState: state.resetState,
  resetKPIs: state.resetKPIs,
  resetConnections: state.resetConnections
}));

// Computed selectors
export const useAvailableAssets = () => {
  const broker = useBroker();
  return broker === 'binance' ? BINANCE_ASSETS : ZAFFER_ASSETS;
};

export const useIsConnected = () => {
  const broker = useBroker();
  const connected = useConnected();
  return connected[broker];
};

export const useCanStart = () => {
  const broker = useBroker();
  const connected = useConnected();
  const killSwitchActive = useKillSwitchActive();
  const assets = useAssets();
  
  return (
    !killSwitchActive &&
    connected[broker] &&
    assets.length > 0
  );
};

export const useCanSwitchToLive = () => {
  const mode = useMode();
  const broker = useBroker();
  const connected = useConnected();
  const risk = useRisk();
  const assets = useAssets();
  
  return (
    mode === 'shadow' &&
    connected[broker] &&
    risk.maxOrderPct <= 0.05 &&
    assets.length > 0
  );
};

// State subscription helpers
export const subscribeToBroker = (callback: (broker: Broker) => void) => {
  return useQcoreState.subscribe(
    state => state.broker,
    callback
  );
};

export const subscribeToMode = (callback: (mode: Mode) => void) => {
  return useQcoreState.subscribe(
    state => state.mode,
    callback
  );
};

export const subscribeToKPIs = (callback: (kpis: QcoreState['kpis']) => void) => {
  return useQcoreState.subscribe(
    state => state.kpis,
    callback
  );
};

export const subscribeToConnections = (callback: (connected: QcoreState['connected']) => void) => {
  return useQcoreState.subscribe(
    state => state.connected,
    callback
  );
};
