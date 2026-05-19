import { api } from './client';
import type { FaceCheckInPayload, FaceCheckInResponse } from './types';

export async function faceCheckIn(payload: FaceCheckInPayload): Promise<FaceCheckInResponse> {
  const { data } = await api.post<FaceCheckInResponse>('/attendance/face-checkin', payload);
  return data;
}

export interface CheckOutPayload {
  deviceId?: string;
  latitude?: number;
  longitude?: number;
  wifiSSID?: string;
}

export interface AttendanceHistoryItem {
  id: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  location?: string | null;
  photoUrl?: string | null;
  faceMatch?: boolean;
  faceConfidence?: number;
}

export interface AttendanceHistoryResponse {
  items: AttendanceHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export async function checkOut(payload: CheckOutPayload): Promise<{ success: boolean; message?: string }> {
  const { data } = await api.post('/attendance/check-out', payload);
  return data;
}

export async function getHistory(page = 1, limit = 20): Promise<AttendanceHistoryResponse> {
  const { data } = await api.get<AttendanceHistoryResponse>('/attendance/history', {
    params: { page, limit },
  });
  return data;
}
