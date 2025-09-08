import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Time } from "lightweight-charts";

export type TradeMarker = {
  id: string; // nuevo
  time: Time; // seconds epoch
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "arrowUp" | "arrowDown";
  text: string;
};

type State = {
  byKey: Record<string, TradeMarker[]>;
  show: boolean;
  add: (key: string, m: TradeMarker) => void;
  list: (key: string) => TradeMarker[];
  clear: (key: string) => void;
  toggle: () => void;
};

export const useTradeMarkers = create(
  persist<State>(
    (set, get) => ({
      byKey: {},
      show: true,
      add: (key, m) => {
        const cur = get().byKey[key] || [];
        if (cur.some(x => x.id === m.id)) return; // dedupe
        set({ byKey: { ...get().byKey, [key]: [...cur, m] } });
      },
      list: (key) => get().byKey[key] || [],
      clear: (key) => set({ byKey: { ...get().byKey, [key]: [] } }),
      toggle: () => set(s => ({ show: !s.show })),
    }),
    { name: "qt:tradeMarkers" }
  )
);
