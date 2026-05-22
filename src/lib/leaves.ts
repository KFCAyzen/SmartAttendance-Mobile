import { useTranslation } from 'react-i18next';
import type { LeaveStatus, LeaveType } from '../api/leaves';

export function useLeaveTypeLabel(type: LeaveType): string {
  const { t } = useTranslation();
  return t(`leaveTypes.${type}`);
}

export function useLeaveStatusLabel(status: LeaveStatus): string {
  const { t } = useTranslation();
  return t(`leaveStatuses.${status}`);
}

export const LEAVE_STATUS_COLOR: Record<LeaveStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-warning/15', text: 'text-warning' },
  APPROVED: { bg: 'bg-success/15', text: 'text-success' },
  REJECTED: { bg: 'bg-danger/15', text: 'text-danger' },
  CANCELLED: { bg: 'bg-slate-200', text: 'text-slate-600' },
  INTERRUPTED: { bg: 'bg-slate-200', text: 'text-slate-600' },
};
