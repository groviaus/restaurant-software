import { create } from 'zustand';
import { Outlet } from '@/lib/types';

interface OutletStore {
  currentOutletId: string | null;
  outlets: Outlet[];
  setCurrentOutlet: (outletId: string | null) => void;
  setOutlets: (outlets: Outlet[]) => void;
  loadOutlets: () => Promise<void>;
  getCurrentOutlet: () => Outlet | undefined;
}

export const useOutletStore = create<OutletStore>((set, get) => ({
  currentOutletId: null,
  outlets: [],

  setCurrentOutlet: (outletId) => set({ currentOutletId: outletId }),

  setOutlets: (outlets) => set({ outlets }),

  loadOutlets: async () => {
    try {
      const response = await fetch('/api/outlets');
      if (response.ok) {
        const data = await response.json();
        set({ outlets: data.outlets || [] });
      }
    } catch (error) {
      console.error('Failed to load outlets:', error);
    }
  },

  getCurrentOutlet: () => {
    const { currentOutletId, outlets } = get();
    return outlets.find((outlet) => outlet.id === currentOutletId);
  },
}));

