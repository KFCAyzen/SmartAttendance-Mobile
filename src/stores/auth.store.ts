import { create } from 'zustand';

import { clearAuth, getItem, setItem, StorageKeys } from '../lib/secure-storage';
import type { User } from '../api/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  hydrate: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'idle',

  async hydrate() {
    set({ status: 'loading' });
    const token = await getItem(StorageKeys.AccessToken);
    const rawUser = await getItem(StorageKeys.CurrentUser);
    if (token && rawUser) {
      try {
        const user = JSON.parse(rawUser) as User;
        set({ accessToken: token, user, status: 'authenticated' });
        return;
      } catch {
        await clearAuth();
      }
    }
    set({ accessToken: null, user: null, status: 'unauthenticated' });
  },

  async setSession(token, user) {
    await setItem(StorageKeys.AccessToken, token);
    await setItem(StorageKeys.CurrentUser, JSON.stringify(user));
    set({ accessToken: token, user, status: 'authenticated' });
  },

  async clearSession() {
    await clearAuth();
    set({ accessToken: null, user: null, status: 'unauthenticated' });
  },
}));
