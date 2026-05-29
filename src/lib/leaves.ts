import type { TFunction } from 'i18next';
import type { LeaveStatus, LeaveType } from '../api/leaves';

export function getLeaveTypeLabel(t: TFunction, type: LeaveType): string {
  return t(`leaveTypes.${type}`);
}

export function getLeaveStatusLabel(t: TFunction, status: LeaveStatus): string {
  return t(`leaveStatuses.${status}`);
}

export const LEAVE_STATUS_COLOR: Record<LeaveStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-warning/15', text: 'text-warning' },
  APPROVED: { bg: 'bg-success/15', text: 'text-success' },
  REJECTED: { bg: 'bg-danger/15', text: 'text-danger' },
  CANCELLED: { bg: 'bg-slate-200', text: 'text-slate-600' },
  INTERRUPTED: { bg: 'bg-slate-200', text: 'text-slate-600' },
};
