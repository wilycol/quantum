import { create } from "zustand";
import { persist } from "zustand/middleware";

type MarketState = {
  symbol: string;
  interval: string;
  setSymbol: (symbol: string) => void;
  setInterval: (interval: string) => void;
};

export const useMarketStore = create(
  persist<MarketState>(
    (set) => ({
      symbol: "BTCUSDT",
      interval: "1m",
      setSymbol: (symbol) => set({ symbol }),
      setInterval: (interval) => set({ interval }),
    }),
    { name: "qt:market" }
  )
);
