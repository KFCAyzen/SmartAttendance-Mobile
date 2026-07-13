/**
 * Thème du back-office admin — port React Native de `buildVars(t)` du handoff design.
 * On fige les défauts "sobre / confortable / radius soft" (cf. décision produit) :
 * pas de densité dense ni de ton expressif → ni color-mix ni dégradés de KPI.
 * Les seules variantes restantes sont clair / sombre.
 */

import i18n from '../../i18n';

export interface AdminPalette {
  bg: string;
  surface: string;
  surface2: string;
  elev: string;
  ink: string;
  muted: string;
  muted2: string;
  line: string;
  // marque & sémantique (communes aux deux thèmes)
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
}

const LIGHT: AdminPalette = {
  bg: '#F1F3FA',
  surface: '#FFFFFF',
  surface2: '#F7F8FD',
  elev: '#FFFFFF',
  ink: '#0E1326',
  muted: '#717A90',
  muted2: '#9AA2B5',
  line: 'rgba(14,19,38,0.08)',
  primary: '#2F5BFF',
  accent: '#FF8A3D',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
};

const DARK: AdminPalette = {
  bg: '#080B14',
  surface: '#121829',
  surface2: '#1A2236',
  elev: '#222C44',
  ink: '#F3F6FD',
  muted: '#9AA5BE',
  muted2: '#67718C',
  line: 'rgba(255,255,255,0.09)',
  primary: '#2F5BFF',
  accent: '#FF8A3D',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export function adminPalette(scheme: 'light' | 'dark' | null | undefined): AdminPalette {
  return scheme === 'dark' ? DARK : LIGHT;
}

/** Rayons (variante "soft" du handoff). */
export const RADIUS = { sm: 12, base: 20, lg: 28, pill: 999 } as const;

/** Ombre portée des cartes (équivalent de --shadow). */
export const cardShadow = {
  shadowColor: '#142046',
  shadowOpacity: 0.1,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 12 },
  elevation: 3,
} as const;

/** Convertit un hex #RRGGBB en rgba avec alpha (remplace les color-mix transparents). */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type Tone = 'primary' | 'success' | 'warning' | 'accent' | 'danger' | 'neutral';

/** Couleur de premier plan d'un ton sémantique. */
export function toneColor(p: AdminPalette, tone: Tone): string {
  switch (tone) {
    case 'success':
      return p.success;
    case 'warning':
      return p.warning;
    case 'accent':
      return p.accent;
    case 'danger':
      return p.danger;
    case 'neutral':
      return p.muted;
    default:
      return p.primary;
  }
}

/** Fond doux (pill / pastille d'icône) d'un ton sémantique. */
export function toneSoft(p: AdminPalette, tone: Tone): string {
  switch (tone) {
    case 'success':
      return withAlpha(p.success, 0.14);
    case 'warning':
      return withAlpha(p.warning, 0.16);
    case 'accent':
      return withAlpha(p.accent, 0.16);
    case 'danger':
      return withAlpha(p.danger, 0.1);
    case 'neutral':
      return p.surface2;
    default:
      return withAlpha(p.primary, 0.12);
  }
}

/** Statut de présence d'un employé → libellé + ton + couleur. */
export type PresenceStatus = 'present' | 'late' | 'remote' | 'leave' | 'absent';

export function statusMeta(p: AdminPalette, status: PresenceStatus): {
  label: string;
  tone: Tone;
  color: string;
} {
  // Libellés via i18n : suivent la langue ET le contexte de l'instance
  // (mode école : « En congé » devient « Absence autorisée »).
  switch (status) {
    case 'present':
      return { label: i18n.t('admin.bo.status.present'), tone: 'success', color: p.success };
    case 'late':
      return { label: i18n.t('admin.bo.status.late'), tone: 'warning', color: p.warning };
    case 'remote':
      return { label: i18n.t('admin.bo.status.remote'), tone: 'primary', color: p.primary };
    case 'leave':
      return { label: i18n.t('admin.bo.status.leave'), tone: 'accent', color: p.accent };
    default:
      return { label: i18n.t('admin.bo.status.absent'), tone: 'neutral', color: p.muted2 };
  }
}

/** Teinte déterministe à partir d'un nom (avatars dégradés). */
export function hueFor(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

/** Polices chargées dans app/_layout.tsx. */
export const FONT = {
  display: 'BricolageGrotesque_700Bold',
  body: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;
