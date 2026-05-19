import { api } from './client';

export type DeviceStatus = 'PENDING' | 'ACTIVE' | 'REVOKED';

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
