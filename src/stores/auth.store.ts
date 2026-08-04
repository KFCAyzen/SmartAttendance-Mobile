import { create } from 'zustand';

import { humanizeApiError } from '../api/client';
import { registerDevice, type DeviceStatus } from '../api/devices';
import type { User } from '../api/types';
import { getOrCreateDeviceId } from '../lib/device-id';
import { getDeviceDescriptor } from '../lib/device-info';
import { clearAuth, getItem, setItem, StorageKeys } from '../lib/secure-storage';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'verifying_device'
  | 'device_pending'
  | 'device_error'
  | 'authenticated'
  | 'unauthenticated';

/**
 * Point de vue actif de la session. Un admin/RH peut basculer son interface
 * entière vers l'espace employé (`employee`) puis revenir (`admin`) sans se
 * déconnecter. Purement en mémoire : réinitialisé à `admin` à chaque session.
 */
export type ViewMode = 'admin' | 'employee';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  deviceStatus: DeviceStatus | null;
  deviceError: string | null;
  viewMode: ViewMode;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  clearSession: () => Promise<void>;
  verifyDevice: () => Promise<DeviceStatus | null>;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => ViewMode;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  deviceStatus: null,
  deviceError: null,
  viewMode: 'admin',

  async hydrate() {
    set({ status: 'loading' });
    const token = await getItem(StorageKeys.AccessToken);
    const rawUser = await getItem(StorageKeys.CurrentUser);
    if (!token || !rawUser) {
      await clearAuth();
      set({
      accessToken: null,
      user: null,
      deviceStatus: null,
      deviceError: null,
      status: 'unauthenticated',
    });
      return;
    }
    try {
      const user = JSON.parse(rawUser) as User;
      set({ accessToken: token, user });
      await get().verifyDevice();
    } catch {
      await clearAuth();
      set({
      accessToken: null,
      user: null,
      deviceStatus: null,
      deviceError: null,
      status: 'unauthenticated',
    });
    }
  },

  async setSession(token, user) {
    await setItem(StorageKeys.AccessToken, token);
    await setItem(StorageKeys.CurrentUser, JSON.stringify(user));
    set({ accessToken: token, user, status: 'verifying_device', viewMode: 'admin' });
    // Le cache React Query est persisté sur disque (24h) pour un démarrage
    // hors-ligne instantané — mais sans ce clear, une nouvelle connexion (autre
    // compte, ou même compte avec des structures créées depuis le web) resterait
    // masquée par les données de la session précédente jusqu'à expiration du
    // staleTime (60s) ET un refetch réseau réussi, ce qui peut ne jamais arriver
    // silencieusement si ce refetch échoue en tâche de fond.
    const { queryClient } = await import('../components/Providers');
    queryClient.clear();
    // Une structure active choisie par un précédent compte admin sur cet
    // appareil ne doit pas fuiter vers ce nouveau compte (403 sinon côté API
    // dès qu'elle ne lui appartient plus) : on repart du repli par défaut.
    const { useStructureStore } = await import('./structure.store');
    useStructureStore.getState().setActive(null).catch(() => {});
    // Multi-structures : le contexte (entreprise/école) dépend de la structure
    // de l'utilisateur connecté — on le rafraîchit dès que le jeton est posé.
    const { useAppContextStore } = await import('./app-context.store');
    useAppContextStore.getState().refresh().catch(() => {});
    await get().verifyDevice();
  },

  async clearSession() {
    await clearAuth();
    set({
      accessToken: null,
      user: null,
      deviceStatus: null,
      deviceError: null,
      status: 'unauthenticated',
      viewMode: 'admin',
    });
    const { queryClient } = await import('../components/Providers');
    queryClient.clear();
    const { useStructureStore } = await import('./structure.store');
    useStructureStore.getState().setActive(null).catch(() => {});
    // Retour au vocabulaire neutre de l'écran de connexion.
    const { useAppContextStore } = await import('./app-context.store');
    useAppContextStore.getState().refresh().catch(() => {});
  },

  setViewMode(mode) {
    set({ viewMode: mode });
  },

  toggleViewMode() {
    const next: ViewMode = get().viewMode === 'admin' ? 'employee' : 'admin';
    set({ viewMode: next });
    return next;
  },

  async verifyDevice() {
    const { accessToken, user } = get();
    if (!accessToken) {
      set({ status: 'unauthenticated' });
      return null;
    }
    // Admins are never gated by device verification — the device is registered
    // best-effort, but its status (or any failure) never blocks them.
    const isAdmin = user?.role === 'ADMIN';
    const deviceId = await getOrCreateDeviceId();
    const descriptor = getDeviceDescriptor();
    try {
      const { status: deviceStatus } = await registerDevice({
        deviceId,
        deviceName: descriptor.deviceName,
        platform: descriptor.platform,
      });
      const resolved = isAdmin ? 'ACTIVE' : deviceStatus;
      set({
        deviceStatus: resolved,
        deviceError: null,
        status: resolved === 'ACTIVE' ? 'authenticated' : 'device_pending',
      });
      return resolved;
    } catch (error) {
      if (isAdmin) {
        set({ deviceStatus: 'ACTIVE', deviceError: null, status: 'authenticated' });
        return 'ACTIVE';
      }
      // A network/server error is NOT a genuine "pending" device. Surface it as
      // a retryable error instead of masquerading as the device-approval flow,
      // and never throw (so a transient failure can't drop the whole session).
      set({ deviceError: humanizeApiError(error), status: 'device_error' });
      return null;
    }
  },
}));
