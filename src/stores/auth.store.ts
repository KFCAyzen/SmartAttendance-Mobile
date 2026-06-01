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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  deviceStatus: DeviceStatus | null;
  deviceError: string | null;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  clearSession: () => Promise<void>;
  verifyDevice: () => Promise<DeviceStatus | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  deviceStatus: null,
  deviceError: null,

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
    set({ accessToken: token, user, status: 'verifying_device' });
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
    });
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
