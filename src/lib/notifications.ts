import type { NotificationType } from '../api/notifications';

interface VisualSpec {
  icon: 'information-circle' | 'warning' | 'close-circle' | 'checkmark-circle' | 'calendar' | 'time';
  color: string;
  bg: string;
}

const DEFAULT: VisualSpec = { icon: 'information-circle', color: '#3B82F6', bg: 'bg-primary/10' };

export function notificationVisual(type: NotificationType): VisualSpec {
  switch (type) {
    case 'SUCCESS':
    case 'LEAVE_APPROVED':
    case 'LEAVE_RESTORED':
      return { icon: 'checkmark-circle', color: '#2F855A', bg: 'bg-success/10' };
    case 'WARNING':
    case 'LEAVE_INTERRUPTED':
      return { icon: 'warning', color: '#C2410C', bg: 'bg-warning/10' };
    case 'ERROR':
    case 'LEAVE_REJECTED':
      return { icon: 'close-circle', color: '#991B1B', bg: 'bg-danger/10' };
    case 'ATTENDANCE_REMINDER':
      return { icon: 'time', color: '#1E40AF', bg: 'bg-primary/10' };
    case 'INFO':
    default:
      return DEFAULT;
  }
}
