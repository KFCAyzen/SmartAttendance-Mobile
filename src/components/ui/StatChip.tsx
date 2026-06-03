import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type ChipTone = 'primary' | 'success' | 'accent';

interface StatChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: ChipTone;
}

const ICON_COLOR: Record<ChipTone, string> = {
  primary: '#2F5BFF',
  success: '#16A34A',
  accent: '#FF8A3D',
};

/** Petite tuile KPI : icône (teintée) + label (uppercase, muted) + valeur (display). */
export function StatChip({ icon, label, value, tone = 'primary' }: StatChipProps) {
  return (
    <View className="flex-1 gap-[7px] rounded-[20px] border border-black/5 bg-surface-soft p-3 dark:border-white/10 dark:bg-surface-softDark">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={16} color={ICON_COLOR[tone]} />
        <Text className="text-[11px] font-bodySemibold uppercase tracking-wide text-muted dark:text-slate-400">
          {label}
        </Text>
      </View>
      <Text className="font-display text-[19px] text-ink dark:text-white">{value}</Text>
    </View>
  );
}
