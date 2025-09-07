import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  showVolume: boolean;
  rightOpen: boolean;
  setShowVolume: (v: boolean) => void;
  toggleRight: () => void;
};

export const useUiStore = create(
  persist<UiState>(
    (set) => ({
      showVolume: true,
      rightOpen: true,
      setShowVolume: (v) => set({ showVolume: v }),
      toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
    }),
    { name: "qt:ui" }
  )
);
