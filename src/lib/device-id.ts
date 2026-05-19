import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { getItem, setItem, StorageKeys } from './secure-storage';

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await getItem(StorageKeys.DeviceId);
  if (existing) return existing;
  const id = uuidv4();
  await setItem(StorageKeys.DeviceId, id);
  return id;
}
