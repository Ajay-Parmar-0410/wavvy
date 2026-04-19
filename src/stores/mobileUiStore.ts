import { create } from "zustand";

interface MobileUiState {
  profileDrawerOpen: boolean;
  createSheetOpen: boolean;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
  openCreateSheet: () => void;
  closeCreateSheet: () => void;
}

export const useMobileUiStore = create<MobileUiState>((set) => ({
  profileDrawerOpen: false,
  createSheetOpen: false,
  openProfileDrawer: () => set({ profileDrawerOpen: true }),
  closeProfileDrawer: () => set({ profileDrawerOpen: false }),
  openCreateSheet: () => set({ createSheetOpen: true }),
  closeCreateSheet: () => set({ createSheetOpen: false }),
}));
