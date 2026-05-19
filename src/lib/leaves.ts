import type { LeaveStatus, LeaveType } from '../api/leaves';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  VACATION: 'Congés payés',
  SICK: 'Arrêt maladie',
  PERSONAL: 'Personnel',
  MATERNITY: 'Maternité',
  PATERNITY: 'Paternité',
  UNPAID: 'Sans solde',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  CANCELLED: 'Annulé',
  INTERRUPTED: 'Interrompu',
};

export const LEAVE_STATUS_COLOR: Record<LeaveStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-warning/15', text: 'text-warning' },
  APPROVED: { bg: 'bg-success/15', text: 'text-success' },
  REJECTED: { bg: 'bg-danger/15', text: 'text-danger' },
  CANCELLED: { bg: 'bg-slate-200', text: 'text-slate-600' },
  INTERRUPTED: { bg: 'bg-slate-200', text: 'text-slate-600' },
};
