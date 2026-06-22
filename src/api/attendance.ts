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
  userId?: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  latitude?: number | null;
  longitude?: number | null;
  wifiSSID?: string | null;
  location?: { id: string; name: string } | null;
  photoUrl?: string | null;
  faceMatch?: boolean;
  faceConfidence?: number | null;
  hoursWorked?: number | null;
  overtimeHours?: number | null;
}

export interface AttendanceHistoryResponse {
  data: AttendanceHistoryItem[];
  attendances?: AttendanceHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

export interface WeeklyStatsDay {
  /** `YYYY-MM-DD` */
  date: string;
  /** 1 = lundi … 7 = dimanche */
  weekday: number;
  hours: number;
}

export interface WeeklyStatsResponse {
  weekStart: string;
  targetHours: number;
  totalHours: number;
  onTimePct: number | null;
  days: WeeklyStatsDay[];
}

export async function getWeeklyStats(): Promise<WeeklyStatsResponse> {
  const { data } = await api.get<WeeklyStatsResponse>('/attendance/weekly-stats');
  return data;
}
