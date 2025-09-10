import { create } from 'zustand';

type LogicalRange = { from: number; to: number };

type State = {
  followRight: boolean;
  setFollowRight: (v: boolean) => void;
  getSavedRange: (key: string) => LogicalRange | null;
  saveRange: (key: string, r: LogicalRange) => void;
};

export const useChartUI = create<State>((set) => ({
  followRight: true,
  setFollowRight: (v) => set({ followRight: v }),
  getSavedRange: (key) => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
  },
  saveRange: (key, r) => { try { localStorage.setItem(key, JSON.stringify(r)); } catch {} }
}));
