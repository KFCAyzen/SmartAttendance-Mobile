import { api } from './client';

export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'INTERRUPTED';

export interface Leave {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  reason?: string | null;
  attachmentUrl?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface LeaveBalance {
  type: LeaveType;
  year: number;
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
