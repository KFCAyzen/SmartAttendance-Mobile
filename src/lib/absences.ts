import type { AbsenceStatus, AbsenceType } from '../api/absences';

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  LATE: 'Retard',
  UNJUSTIFIED: 'Non justifiée',
  JUSTIFIED: 'Justifiée',
  HALF_DAY: 'Demi-journée',
  NO_SHOW: 'Absence',
};

export const ABSENCE_STATUS_LABELS: Record<AbsenceStatus, string> = {
  PENDING: 'En attente',
  JUSTIFIED: 'Justifiée',
  UNJUSTIFIED: 'Non justifiée',
  EXCUSED: 'Excusée',
};

export const ABSENCE_STATUS_COLOR: Record<AbsenceStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-warning/15', text: 'text-warning' },
  JUSTIFIED: { bg: 'bg-success/15', text: 'text-success' },
  EXCUSED: { bg: 'bg-success/15', text: 'text-success' },
  UNJUSTIFIED: { bg: 'bg-danger/15', text: 'text-danger' },
};

export function canJustify(status: AbsenceStatus): boolean {
  return status === 'PENDING' || status === 'UNJUSTIFIED';
}
