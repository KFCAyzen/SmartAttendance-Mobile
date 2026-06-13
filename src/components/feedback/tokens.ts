/* tokens.ts — design-system colours for the feedback surfaces.
   Mirrors the app palette (primary #2F5BFF, success/danger/warning, slate neutrals). */

import { Platform } from 'react-native';
import type { ToastType } from './types';

export const COLORS = {
  primary: '#2F5BFF',
  success: '#16A34A',
  danger: '#EF4444',
  warning: '#F59E0B',
} as const;

export interface Tokens {
  surface: string;
  ink: string;
  muted: string;
  line: string;
  barBg: string;
  barText: string;
  action: string;
  shadowColor: string;
}

export function getTokens(dark: boolean): Tokens {
  return dark
    ? {
        surface: '#141B2E',
        ink: '#F3F6FD',
        muted: '#9AA5BE',
        line: 'rgba(255,255,255,0.10)',
        barBg: '#2D3344',
        barText: '#F4F6FD',
        action: '#8AA9FF',
        shadowColor: '#000000',
      }
    : {
        surface: '#FFFFFF',
        ink: '#0E1326',
        muted: '#69728B',
        line: 'rgba(14,19,38,0.09)',
        barBg: '#22262F',
        barText: '#F4F6FD',
        action: '#8AA9FF',
        shadowColor: '#1A2340',
      };
}

/** type → Ionicons name + brand colour */
export const PILL_ICON: Record<ToastType, { icon: 'checkmark-circle' | 'alert-circle' | 'information-circle' | 'warning'; color: string }> = {
  success: { icon: 'checkmark-circle', color: COLORS.success },
  error: { icon: 'alert-circle', color: COLORS.danger },
  info: { icon: 'information-circle', color: COLORS.primary },
  warning: { icon: 'warning', color: COLORS.warning },
};

/** snackbar corner radius — slightly sharper on Android (Material) */
export const SNACK_RADIUS = Platform.select({ ios: 14, android: 10, default: 12 }) as number;
