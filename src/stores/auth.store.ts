import { create } from 'zustand';

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
  | 'authenticated'
  | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  deviceStatus: DeviceStatus | null;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: User) => Promise<void>;
  clearSession: () => Promise<void>;
  verifyDevice: () => Promise<DeviceStatus>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  deviceStatus: null,

  async hydrate() {
    set({ status: 'loading' });
    const token = await getItem(StorageKeys.AccessToken);
    const rawUser = await getItem(StorageKeys.CurrentUser);
    if (!token || !rawUser) {
      await clearAuth();
      set({ accessToken: null, user: null, deviceStatus: null, status: 'unauthenticated' });
      return;
    }
    try {
      const user = JSON.parse(rawUser) as User;
      set({ accessToken: token, user });
      await get().verifyDevice();
    } catch {
      await clearAuth();
      set({ accessToken: null, user: null, deviceStatus: null, status: 'unauthenticated' });
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
    set({ accessToken: null, user: null, deviceStatus: null, status: 'unauthenticated' });
  },

  async verifyDevice() {
    if (!get().accessToken) {
      set({ status: 'unauthenticated' });
      return 'PENDING';
    }
    const deviceId = await getOrCreateDeviceId();
    const descriptor = getDeviceDescriptor();
    try {
      const { status: deviceStatus } = await registerDevice({
        deviceId,
        deviceName: descriptor.deviceName,
        platform: descriptor.platform,
      });
      set({
        deviceStatus,
        status: deviceStatus === 'ACTIVE' ? 'authenticated' : 'device_pending',
      });
      return deviceStatus;
    } catch (error) {
      // Network or server error: keep user authenticated locally, treat device as pending
      // so they reach the pending screen and can retry.
      set({ deviceStatus: 'PENDING', status: 'device_pending' });
      throw error;
    }
  },
}));
