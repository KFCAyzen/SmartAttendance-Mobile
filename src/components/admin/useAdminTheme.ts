import { useColorScheme } from 'react-native';

import { adminPalette, type AdminPalette } from './theme';

/** Palette admin résolue selon le thème système (clair/sombre). */
export function useAdminTheme(): AdminPalette {
  const scheme = useColorScheme();
  return adminPalette(scheme);
}
