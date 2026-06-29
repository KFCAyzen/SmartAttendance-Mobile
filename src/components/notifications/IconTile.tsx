import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import type { IoniconName, NotificationTone } from '~/lib/notifications';

/** Couleur pleine de l'icône (identique clair/sombre, cf. handoff). */
export const TONE_COLOR: Record<NotificationTone, string> = {
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  primary: '#2F5BFF',
  accent: '#FF8A3D',
};

/** Fond « soft » de la tuile (~12–16% d'opacité). */
const TONE_SOFT: Record<NotificationTone, string> = {
  success: 'rgba(22,163,74,0.14)',
  warning: 'rgba(245,158,11,0.16)',
  danger: 'rgba(239,68,68,0.13)',
  primary: 'rgba(47,91,255,0.12)',
  accent: 'rgba(255,138,61,0.16)',
};

export function IconTile({
  icon,
  tone,
  size = 44,
  dim,
}: {
  icon: IoniconName;
  tone: NotificationTone;
  size?: number;
  dim?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: TONE_SOFT[tone],
        alignItems: 'center',
        justifyContent: 'center',
        opacity: dim ? 0.6 : 1,
      }}
    >
      <Ionicons name={icon} size={Math.round(size * 0.46)} color={TONE_COLOR[tone]} />
    </View>
  );
}
