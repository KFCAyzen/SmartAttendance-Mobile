import { api } from './client';
import type { DeviceStatus } from './shared-types.generated';

// Enum Prisma synchronisé depuis le backend (npm run sync:types).
export type { DeviceStatus } from './shared-types.generated';

export interface RegisterDevicePayload {
  deviceId: string;
  deviceName?: string;
  platform?: string;
  macAddress?: string;
}

export interface RegisterDeviceResponse {
  device: {
    id: string;
    deviceId: string;
    status: DeviceStatus;
    deviceName?: string | null;
    platform?: string | null;
  };
  status: DeviceStatus;
  message?: string;
}

export async function registerDevice(
  payload: RegisterDevicePayload,
): Promise<RegisterDeviceResponse> {
  const { data } = await api.post<RegisterDeviceResponse>('/device/register', payload);
  return data;
}
