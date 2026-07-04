import { Ionicons } from '@expo/vector-icons';

/**
 * Mappe les noms d'icônes du handoff design (set stroke maison) vers les
 * glyphes Ionicons — même librairie que le reste de l'app (CustomTabBar).
 * Style « outline » conservé pour rester fidèle au trait du design.
 */
const MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  // ui.jsx
  home: 'home-outline',
  clock: 'time-outline',
  clockSmall: 'time-outline',
  doc: 'document-text-outline',
  user: 'person-outline',
  bell: 'notifications-outline',
  plus: 'add',
  calendar: 'calendar-outline',
  check: 'checkmark',
  checkCircle: 'checkmark-circle-outline',
  location: 'location-outline',
  settings: 'settings-outline',
  globe: 'globe-outline',
  moon: 'moon-outline',
  logout: 'log-out-outline',
  camera: 'camera-outline',
  scan: 'scan-outline',
  face: 'happy-outline',
  chevron: 'chevron-forward',
  chevronLeft: 'chevron-back',
  chevronDown: 'chevron-down',
  sparkle: 'sparkles-outline',
  shield: 'shield-checkmark-outline',
  trend: 'trending-up',
  // admin-ui.jsx
  search: 'search-outline',
  filter: 'filter-outline',
  users: 'people-outline',
  grid: 'grid-outline',
  pulse: 'pulse-outline',
  download: 'download-outline',
  xmark: 'close',
  edit: 'create-outline',
  phone: 'call-outline',
  mail: 'mail-outline',
  dots: 'ellipsis-horizontal',
  building: 'business-outline',
  cpu: 'hardware-chip-outline',
  bars: 'bar-chart-outline',
  sliders: 'options-outline',
  wifi: 'wifi-outline',
  upload: 'cloud-upload-outline',
  briefcase: 'briefcase-outline',
  award: 'ribbon-outline',
  key: 'key-outline',
  ban: 'ban-outline',
  trash: 'trash-outline',
  swap: 'swap-horizontal-outline',
};

export type AdminIconName = keyof typeof MAP;

export function AdminIcon({
  name,
  size = 22,
  color = '#000',
}: {
  name: AdminIconName | string;
  size?: number;
  color?: string;
}) {
  const glyph = MAP[name] ?? 'ellipse-outline';
  return <Ionicons name={glyph} size={size} color={color} />;
}
