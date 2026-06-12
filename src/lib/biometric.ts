import * as LocalAuthentication from 'expo-local-authentication';

import type { User } from '../api/types';
import { getItem, removeItem, setItem, StorageKeys } from './secure-storage';

export type BiometricSupport = {
  available: boolean;
  isFace: boolean;
};

/** Whether the device has biometric hardware AND the user has enrolled a face/fingerprint. */
export async function getBiometricSupport(): Promise<BiometricSupport> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  return {
    available: hasHardware && isEnrolled,
    isFace: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
  };
}

/** Persist the session so it can be unlocked later behind the device biometric. */
export async function saveBiometricSession(token: string, user: User): Promise<void> {
  await setItem(StorageKeys.BioToken, token);
  await setItem(StorageKeys.BioUser, JSON.stringify(user));
}

export async function getBiometricSession(): Promise<{ token: string; user: User } | null> {
  const token = await getItem(StorageKeys.BioToken);
  const raw = await getItem(StorageKeys.BioUser);
  if (!token || !raw) return null;
  try {
    return { token, user: JSON.parse(raw) as User };
  } catch {
    return null;
  }
}

export async function clearBiometricSession(): Promise<void> {
  await Promise.all([removeItem(StorageKeys.BioToken), removeItem(StorageKeys.BioUser)]);
}

/** Trigger the OS biometric prompt. Resolves true only on a confirmed match. */
export async function promptBiometric(promptMessage: string, cancelLabel: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel,
    disableDeviceFallback: false,
  });
  return result.success;
}
