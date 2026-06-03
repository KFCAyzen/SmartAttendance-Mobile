import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export type PillTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'accent'
  | 'danger'
  | 'neutral';

interface StatusPillProps {
  children: ReactNode;
  tone?: PillTone;
  /** Affiche un point coloré 6px à gauche du texte. */
  dot?: boolean;
  /** Élément optionnel (icône Ionicons) rendu avant le texte. */
  icon?: ReactNode;
  className?: string;
}

const TONE: Record<PillTone, { bg: string; text: string; dot: string }> = {
  primary: { bg: 'bg-primary/12', text: 'text-primary', dot: 'bg-primary' },
  success: { bg: 'bg-success/15', text: 'text-success', dot: 'bg-success' },
  warning: { bg: 'bg-warning/15', text: 'text-warning', dot: 'bg-warning' },
  accent: { bg: 'bg-accent/15', text: 'text-accent', dot: 'bg-accent' },
  danger: { bg: 'bg-danger/15', text: 'text-danger', dot: 'bg-danger' },
  neutral: {
    bg: 'bg-surface-soft dark:bg-surface-softDark',
    text: 'text-muted dark:text-slate-400',
    dot: 'bg-muted',
  },
};

/** Pastille arrondie tintée. */
export function StatusPill({
  children,
  tone = 'primary',
  dot = false,
  icon,
  className = '',
}: StatusPillProps) {
  const c = TONE[tone];
  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full px-3 py-[5px] ${c.bg} ${className}`}
    >
      {dot ? <View className={`h-1.5 w-1.5 rounded-full ${c.dot}`} /> : null}
      {icon}
      <Text className={`text-[11.5px] font-bodyBold ${c.text}`}>{children}</Text>
    </View>
  );
}
