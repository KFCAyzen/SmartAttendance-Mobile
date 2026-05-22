import type { Absence, AbsenceStatus } from './absences';
import { api } from './client';
import type { Leave, LeaveStatus, LeaveType } from './leaves';

interface PagedResponse<T> {
  data?: T[];
  items?: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminPendingCounts {
  leaves: number;
  absences: number;
  devices: number;
  photos: number;
  total: number;
}

export interface AdminOverview {
  totalEmployees: number;
  activeEmployees: number;
  totalCheckIns: number;
  totalCheckOuts: number;
  lateArrivals: number;
  missingCheckouts: number;
  attendanceRate: number;
  punctualityRate: number;
  avgHoursPerDay: number;
  totalHours: number;
  avgCheckInsPerDay: number;
}

export interface AdminUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string | null;
}

export interface AdminLeave extends Omit<Leave, 'type' | 'status'> {
  type: LeaveType;
  status: LeaveStatus;
  days?: number;
  adminComment?: string | null;
  user?: AdminUserSummary;
}

export interface AdminAbsence extends Absence {
  user?: AdminUserSummary;
}

export async function getAdminPendingCounts(): Promise<AdminPendingCounts> {
  const { data } = await api.get<AdminPendingCounts>('/admin/pending-counts');
  return data;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const { data } = await api.get<AdminOverview>('/admin/analytics/overview');
  return data;
}

export async function getPendingLeaves(page = 1, limit = 20): Promise<PagedResponse<AdminLeave>> {
  const { data } = await api.get<PagedResponse<AdminLeave>>('/admin/leave-requests', {
    params: { status: 'PENDING', page, limit },
  });
  return data;
}

export async function getPendingAbsences(
  page = 1,
  limit = 20,
): Promise<PagedResponse<AdminAbsence>> {
  const { data } = await api.get<PagedResponse<AdminAbsence>>('/admin/absences', {
    params: { status: 'PENDING', page, limit },
  });
  return data;
}

export async function approveLeave(id: string, adminId: string): Promise<AdminLeave> {
  const { data } = await api.post<AdminLeave>(`/admin/leave-requests/${id}/approve`, {
    adminId,
  });
  return data;
}

export async function rejectLeave(
  id: string,
  adminId: string,
  comment: string,
): Promise<AdminLeave> {
  const { data } = await api.post<AdminLeave>(`/admin/leave-requests/${id}/reject`, {
    adminId,
    comment,
  });
  return data;
}

export async function updateAbsenceStatus(
  id: string,
  status: AbsenceStatus,
  adminComment?: string,
): Promise<AdminAbsence> {
  const { data } = await api.patch<AdminAbsence>(`/admin/absences/${id}`, {
    status,
    adminComment,
  });
  return data;
}
