import { api } from './client';
import type { LeaveStatus, LeaveType } from './shared-types.generated';

// Enums Prisma synchronisés depuis le backend (npm run sync:types).
export type { LeaveStatus, LeaveType } from './shared-types.generated';

export interface Leave {
  id: string;
  userId: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string | null;
  attachmentUrl?: string | null;
  adminComment?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  type: LeaveType;
  year?: number;
  total: number;
  used: number;
  remaining: number;
}

export interface CreateLeavePayload {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

interface PagedResponse<T> {
  data?: T[];
  items?: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

export async function listLeaves(page = 1, limit = 20): Promise<PagedResponse<Leave>> {
  const { data } = await api.get<PagedResponse<Leave>>('/leaves', { params: { page, limit } });
  return data;
}

export async function getBalance(): Promise<LeaveBalance[]> {
  const { data } = await api.get<LeaveBalance[] | { balances: LeaveBalance[] }>('/leaves/balance');
  return Array.isArray(data) ? data : (data.balances ?? []);
}

export async function createLeave(payload: CreateLeavePayload): Promise<Leave> {
  const { data } = await api.post<Leave>('/leaves', payload);
  return data;
}

export async function cancelLeave(id: string): Promise<Leave> {
  const { data } = await api.patch<Leave>(`/leaves/${id}`, { status: 'CANCELLED' });
  return data;
}

export async function deleteLeave(id: string): Promise<void> {
  await api.delete(`/leaves/${id}`);
}
