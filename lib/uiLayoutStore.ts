import { create } from 'zustand';

type UIState = {
  collapsed: Record<string, boolean>;
  activeRightTab: 'coach' | 'logs' | 'timeline' | 'qa' | 'dataset';
  setCollapsed: (id: string, v: boolean) => void;
  setRightTab: (t: UIState['activeRightTab']) => void;
  load: () => void;
};

const KEY = 'qc_ui_layout_v1';

export const useUILayout = create<UIState>((set, get) => ({
  collapsed: {},
  activeRightTab: 'coach',
  setCollapsed: (id, v) => {
    const next = { ...get().collapsed, [id]: v };
    set({ collapsed: next });
    try { 
      localStorage.setItem(KEY, JSON.stringify({ c: next, t: get().activeRightTab })); 
    } catch {}
  },
  setRightTab: (t) => {
    set({ activeRightTab: t });
    try { 
      localStorage.setItem(KEY, JSON.stringify({ c: get().collapsed, t })); 
    } catch {}
  },
  load: () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const { c, t } = JSON.parse(raw);
        set({ collapsed: c || {}, activeRightTab: t || 'coach' });
      }
    } catch {}
  },
}));
