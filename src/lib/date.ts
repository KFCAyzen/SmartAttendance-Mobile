import { format, isToday, isYesterday, type Locale } from 'date-fns';
import { fr } from 'date-fns/locale';

type DayLabelOptions = {
  locale?: Locale;
  today?: string;
  yesterday?: string;
};

export function formatDayLabel(
  date: Date | string,
  opts: DayLabelOptions = {},
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return opts.today ?? "Aujourd'hui";
  if (isYesterday(d)) return opts.yesterday ?? 'Hier';
  return format(d, 'EEEE d MMMM', { locale: opts.locale ?? fr });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm', { locale: fr });
}

export function dayKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/** Durée en ms → `HH:MM:SS` (tabular). */
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** Heures décimales → `{ h, m }`. */
export function splitHoursMinutes(hours: number): { h: number; m: number } {
  const total = Math.max(0, Math.round(hours * 60));
  return { h: Math.floor(total / 60), m: total % 60 };
}

/** Heures décimales → `38h54`. */
export function formatHoursShort(hours: number): string {
  const { h, m } = splitHoursMinutes(hours);
  return `${h}h${String(m).padStart(2, '0')}`;
}
