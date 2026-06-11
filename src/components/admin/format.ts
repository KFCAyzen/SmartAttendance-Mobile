/** Initiales à partir d'un prénom + nom (ex. "Yasmine", "Tahiri" → "YT"). */
export function initialsOf(first?: string | null, last?: string | null): string {
  const a = (first ?? '').trim();
  const b = (last ?? '').trim();
  const i1 = a ? a[0] : '';
  const i2 = b ? b[0] : a.length > 1 ? a[1] : '';
  return (i1 + i2).toUpperCase() || '?';
}

/** Date longue en français, capitalisée (ex. "Mercredi 10 juin"). */
export function longDate(d = new Date()): string {
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.replace(/^./, (c) => c.toUpperCase());
}

/** Heure courte HH:mm en français. */
export function shortTime(d = new Date()): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const WEEKDAY_LETTER = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

/** Lettre du jour de la semaine pour une date ISO (yyyy-mm-dd). */
export function weekdayLetter(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return WEEKDAY_LETTER[d.getDay()] ?? '';
}
