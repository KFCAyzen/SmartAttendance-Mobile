import { Ionicons } from '@expo/vector-icons';
import { format, isThisWeek, isToday, type Locale } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { Notification, NotificationType } from '../api/notifications';

interface VisualSpec {
  icon: 'information-circle' | 'warning' | 'close-circle' | 'checkmark-circle' | 'calendar' | 'time';
  color: string;
  bg: string;
}

const DEFAULT: VisualSpec = { icon: 'information-circle', color: '#3B82F6', bg: 'bg-primary/10' };

/** Pastille compacte (utilisée par la feuille basse `NotificationsSheet`). */
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

// ── Vue enrichie pour l'écran Notifications (design_handoff_notifications) ──────
// Le back-end n'expose pas catégorie/groupe/épinglage : on les dérive ici du type,
// de la date et de l'état lu. Centralisé pour rester cohérent et extensible.

export type NotificationCategory = 'pointage' | 'conges' | 'securite';
export type NotificationTone = 'success' | 'warning' | 'danger' | 'primary' | 'accent';
export type NotificationGroup = 'today' | 'week' | 'earlier';
export type IoniconName = keyof typeof Ionicons.glyphMap;

export interface NotificationView {
  id: string;
  title: string;
  message: string;
  unread: boolean;
  category: NotificationCategory;
  tone: NotificationTone;
  icon: IoniconName;
  group: NotificationGroup;
  time: string;
  /** Va dans le bloc « À traiter » (notification actionnable & non lue). */
  pinned: boolean;
  /** Clé i18n de l'action (`notifications.actions.*`) + cible de navigation. */
  actionKey?: string;
  actionTone?: NotificationTone;
  actionRoute?: string;
  /** Lien optionnel du fil : clé i18n (`notifications.links.*`) + cible. */
  link?: { labelKey: 'request' | 'history'; route: string };
  raw: Notification;
}

function toneAndIcon(type: NotificationType): { tone: NotificationTone; icon: IoniconName } {
  switch (type) {
    case 'LEAVE_APPROVED':
      return { tone: 'success', icon: 'checkmark' };
    case 'LEAVE_RESTORED':
    case 'SUCCESS':
      return { tone: 'success', icon: 'checkmark-circle' };
    case 'LEAVE_REJECTED':
    case 'ERROR':
      return { tone: 'danger', icon: 'close-circle' };
    case 'LEAVE_INTERRUPTED':
    case 'WARNING':
      return { tone: 'warning', icon: 'notifications-outline' };
    case 'ATTENDANCE_REMINDER':
      return { tone: 'accent', icon: 'time-outline' };
    case 'INFO':
    default:
      return { tone: 'primary', icon: 'information-circle-outline' };
  }
}

function categoryOf(type: NotificationType): NotificationCategory {
  if (type.startsWith('LEAVE_')) return 'conges';
  if (type === 'WARNING' || type === 'ERROR') return 'securite';
  return 'pointage'; // ATTENDANCE_REMINDER, SUCCESS, INFO
}

function groupOf(date: Date, locale: Locale): NotificationGroup {
  if (isToday(date)) return 'today';
  if (isThisWeek(date, { locale, weekStartsOn: 1 })) return 'week';
  return 'earlier';
}

function timeLabel(date: Date, group: NotificationGroup, locale: Locale): string {
  if (group === 'today') return format(date, 'HH:mm', { locale });
  if (group === 'week') return format(date, 'eee', { locale });
  return format(date, 'd MMM', { locale });
}

function linkOf(type: NotificationType): NotificationView['link'] {
  if (type.startsWith('LEAVE_')) return { labelKey: 'request', route: '/(tabs)/demandes' };
  if (type === 'SUCCESS') return { labelKey: 'history', route: '/(tabs)/historique' };
  return undefined;
}

/** Adapte une notification back-end en vue d'affichage enrichie. */
export function toNotificationView(n: Notification, locale: Locale = fr): NotificationView {
  const date = new Date(n.createdAt);
  const group = groupOf(date, locale);
  const { tone, icon } = toneAndIcon(n.type);
  const unread = !n.isRead;
  const pinned = n.type === 'ATTENDANCE_REMINDER' && unread;

  return {
    id: n.id,
    title: n.title,
    message: n.message,
    unread,
    category: categoryOf(n.type),
    tone,
    icon,
    group,
    time: timeLabel(date, group, locale),
    pinned,
    ...(pinned
      ? { actionKey: 'regulariser', actionTone: 'accent' as const, actionRoute: '/(tabs)/pointage' }
      : null),
    link: linkOf(n.type),
    raw: n,
  };
}
