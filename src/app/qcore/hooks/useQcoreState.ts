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
  kpis: { elapsed: number; balance: number; pnl: number; trades: number; winRate: number };
};

type Actions = {
  setMode: (m: Mode) => void;
  setBroker: (b: Broker) => void;
  setStrategy: (s: 'grid'|'binary') => void;
  setWsStatus: (s: WsStatus) => void;
  toggleKill: (on: boolean) => void;
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
  kpis: { elapsed: 0, balance: 10000, pnl: 0, trades: 0, winRate: 0 },

  setMode: (m) => set({ mode: m }),
  setBroker: (b) => set({ broker: b, strategy: b === 'binance' ? 'grid' : 'binary' }),
  setStrategy: (s) => set({ strategy: s }),
  setWsStatus: (s) => set({ wsStatus: s }),
  toggleKill: (on) => set({ killSwitchActive: on }),
}));

// ⤵️ Selectores que usa Topbar
export const useKillSwitchActive = () => useQcoreState(s => s.killSwitchActive);
export const useQcoreActions = () => useQcoreState(s => ({
  setMode: s.setMode,
  setBroker: s.setBroker,
  setStrategy: s.setStrategy,
  setWsStatus: s.setWsStatus,
  toggleKill: s.toggleKill,
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