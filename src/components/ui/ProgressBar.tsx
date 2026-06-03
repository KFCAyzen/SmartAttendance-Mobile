import { View } from 'react-native';

type BarTone = 'primary' | 'success' | 'accent' | 'warning' | 'danger';

interface ProgressBarProps {
  value: number;
  total: number;
  tone?: BarTone;
}

const FILL: Record<BarTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  accent: 'bg-accent',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

/** Barre de progression (soldes de congés, etc.). */
export function ProgressBar({ value, total, tone = 'primary' }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((value / total) * 100))) : 0;
  return (
    <View className="h-[7px] overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/10">
      <View className={`h-full rounded-full ${FILL[tone]}`} style={{ width: `${pct}%` }} />
    </View>
  );
}
