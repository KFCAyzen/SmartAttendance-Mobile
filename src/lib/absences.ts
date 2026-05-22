import { useTranslation } from 'react-i18next';
import type { AbsenceStatus, AbsenceType } from '../api/absences';

export function useAbsenceTypeLabel(type: AbsenceType): string {
  const { t } = useTranslation();
  return t(`absenceTypes.${type}`);
}

export function useAbsenceStatusLabel(status: AbsenceStatus): string {
  const { t } = useTranslation();
  return t(`absenceStatuses.${status}`);
}

export const ABSENCE_STATUS_COLOR: Record<AbsenceStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-warning/15', text: 'text-warning' },
  JUSTIFIED: { bg: 'bg-success/15', text: 'text-success' },
  EXCUSED: { bg: 'bg-success/15', text: 'text-success' },
  UNJUSTIFIED: { bg: 'bg-danger/15', text: 'text-danger' },
};

export function canJustify(status: AbsenceStatus): boolean {
  return status === 'PENDING' || status === 'UNJUSTIFIED';
}
