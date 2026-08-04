import { create } from 'zustand';

import { getItem, removeItem, setItem, StorageKeys } from '../lib/secure-storage';

interface StructureState {
  activeId: string | null;
  hydrate: () => Promise<void>;
  setActive: (id: string | null) => Promise<void>;
}

export const useStructureStore = create<StructureState>((set) => ({
  activeId: null,

  async hydrate() {
    const saved = await getItem(StorageKeys.ActiveStructureId);
    set({ activeId: saved });
  },

  async setActive(id) {
    if (id) {
      await setItem(StorageKeys.ActiveStructureId, id);
    } else {
      await removeItem(StorageKeys.ActiveStructureId);
    }
    set({ activeId: id });
  },
}));
