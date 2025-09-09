import { create } from 'zustand';

export type Broker = 'binance'|'zaffer';
export type Mode = 'shadow'|'live';
export type WsStatus = 'disconnected'|'connecting'|'connected';

export interface GridConfig { size: number; lower: number; upper: number; stepPct: number }
export interface BinaryConfig { amount: number; expiry: number; direction: 'CALL'|'PUT' }

type State = {
  broker: Broker;
  strategy: 'grid'|'binary';
  mode: Mode;
  assets: string[];
  volumeOn: boolean;
  grid: GridConfig;
  binary: BinaryConfig;
  wsStatus: WsStatus;
  killSwitchActive: boolean;
  showModeConfirmModal: boolean;
  kpis: { elapsed: number; balance: number; pnl: number; trades: number; winRate: number };
};

type Actions = {
  setMode: (m: Mode) => void;
  setBroker: (b: Broker) => void;
  setStrategy: (s: 'grid'|'binary') => void;
  setWsStatus: (s: WsStatus) => void;
  toggleKill: (on: boolean) => void;
  setKillSwitchActive: (active: boolean) => void;
  setShowModeConfirmModal: (show: boolean) => void;
};

export const useQcoreState = create<State & Actions>((set) => ({
  broker: 'binance',
  strategy: 'grid',
  mode: 'shadow',
  assets: ['BTCUSDT','ETHUSDT'],
  volumeOn: true,
  grid: { size: 7, lower: 11000, upper: 11400, stepPct: 0.4 },
  binary: { amount: 50, expiry: 60, direction: 'CALL' },
  wsStatus: 'disconnected',
  killSwitchActive: false,
  showModeConfirmModal: false,
  kpis: { elapsed: 0, balance: 10000, pnl: 0, trades: 0, winRate: 0 },

  setMode: (m) => set({ mode: m }),
  setBroker: (b) => set({ broker: b, strategy: b === 'binance' ? 'grid' : 'binary' }),
  setStrategy: (s) => set({ strategy: s }),
  setWsStatus: (s) => set({ wsStatus: s }),
  toggleKill: (on) => set({ killSwitchActive: on }),
  setKillSwitchActive: (active) => set({ killSwitchActive: active }),
  setShowModeConfirmModal: (show) => set({ showModeConfirmModal: show }),
}));

// ⤵️ Selectores que usan los componentes
export const useBroker = () => useQcoreState(s => s.broker);
export const useStrategy = () => useQcoreState(s => s.strategy);
export const useMode = () => useQcoreState(s => s.mode);
export const useAssets = () => useQcoreState(s => s.assets);
export const useVolumeOn = () => useQcoreState(s => s.volumeOn);
export const useGrid = () => useQcoreState(s => s.grid);
export const useBinary = () => useQcoreState(s => s.binary);
export const useRisk = () => useQcoreState(s => ({ grid: s.grid, binary: s.binary }));
export const useKPIs = () => useQcoreState(s => s.kpis);
export const useConnected = () => useQcoreState(s => s.wsStatus === 'connected');
export const useKillSwitchActive = () => useQcoreState(s => s.killSwitchActive);
export const useShowModeConfirmModal = () => useQcoreState(s => s.showModeConfirmModal);
export const useAvailableAssets = () => useQcoreState(s => s.assets);
export const useCanStart = () => useQcoreState(s => {
  const hasAssets = (s.assets?.length ?? 0) > 0;
  const valid = s.strategy === 'grid' 
    ? (s.grid.upper > s.grid.lower && s.grid.size > 0 && s.grid.stepPct > 0)
    : (s.binary.amount > 0 && !!s.binary.expiry && !!s.binary.direction);
  const wsOk = s.wsStatus === 'connected';
  return hasAssets && valid && wsOk && !s.killSwitchActive;
});

export const useQcoreActions = () => useQcoreState(s => ({
  setMode: s.setMode,
  setBroker: s.setBroker,
  setStrategy: s.setStrategy,
  setWsStatus: s.setWsStatus,
  toggleKill: s.toggleKill,
  setKillSwitchActive: s.setKillSwitchActive,
  setShowModeConfirmModal: s.setShowModeConfirmModal,
}));

export const useCanSwitchToLive = () =>
  useQcoreState(s => {
    const hasAssets = (s.assets?.length ?? 0) > 0;
    const valid =
      s.strategy === 'grid'
        ? (s.grid.upper > s.grid.lower && s.grid.size > 0 && s.grid.stepPct > 0)
        : (s.binary.amount > 0 && !!s.binary.expiry && !!s.binary.direction);
    const wsOk = s.wsStatus === 'connected';
    return hasAssets && valid && wsOk && !s.killSwitchActive;
  });