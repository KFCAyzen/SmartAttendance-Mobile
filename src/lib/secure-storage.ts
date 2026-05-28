import * as SecureStore from 'expo-secure-store';

export const StorageKeys = {
  AccessToken: 'sa.accessToken',
  DeviceId: 'sa.deviceId',
  CurrentUser: 'sa.currentUser',
  CsrfToken: 'sa.csrfToken',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export async function getItem(key: StorageKey): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: StorageKey, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: StorageKey): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    removeItem(StorageKeys.AccessToken),
    removeItem(StorageKeys.CurrentUser),
    removeItem(StorageKeys.CsrfToken),
  ]);
}
