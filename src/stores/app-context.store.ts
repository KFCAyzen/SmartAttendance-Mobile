import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { fetchAppContext, type AppContext } from '../api/config';
import { applyAppContext } from '../i18n';

const STORAGE_KEY = 'sa.appContext';

interface AppContextState {
  context: AppContext;
  /** Applique la dernière valeur connue (hors-ligne) puis rafraîchit depuis l'API. */
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAppContextStore = create<AppContextState>((set, get) => ({
  context: 'ENTERPRISE',

  async hydrate() {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'SCHOOL' || saved === 'ENTERPRISE') {
      set({ context: saved });
      applyAppContext(saved);
    }
    await get().refresh();
  },

  async refresh() {
    try {
      const context = await fetchAppContext();
      if (context !== get().context) {
        set({ context });
        applyAppContext(context);
      }
      await AsyncStorage.setItem(STORAGE_KEY, context);
    } catch {
      // Hors-ligne ou backend indisponible : on garde la dernière valeur connue.
    }
  },
}));
