import i18n from '~/i18n';

/** Locale Intl courant, dérivé de la langue i18n active. */
function currentLocale(): string {
  return i18n.language?.startsWith('en') ? 'en-US' : 'fr-FR';
}

/** Initiales à partir d'un prénom + nom (ex. "Yasmine", "Tahiri" → "YT"). */
export function initialsOf(first?: string | null, last?: string | null): string {
  const a = (first ?? '').trim();
  const b = (last ?? '').trim();
  const i1 = a ? a[0] : '';
  const i2 = b ? b[0] : a.length > 1 ? a[1] : '';
  return (i1 + i2).toUpperCase() || '?';
}

/** Date longue localisée, capitalisée (ex. "Mercredi 10 juin" / "Wednesday, June 10"). */
export function longDate(d = new Date()): string {
  const s = d.toLocaleDateString(currentLocale(), { weekday: 'long', day: 'numeric', month: 'long' });
  return s.replace(/^./, (c) => c.toUpperCase());
}

/** Heure courte HH:mm localisée. */
export function shortTime(d = new Date()): string {
  return d.toLocaleTimeString(currentLocale(), { hour: '2-digit', minute: '2-digit' });
}

/** Lettre du jour de la semaine pour une date ISO (yyyy-mm-dd), selon la langue. */
export function weekdayLetter(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat(currentLocale(), { weekday: 'narrow' }).format(d);
}
