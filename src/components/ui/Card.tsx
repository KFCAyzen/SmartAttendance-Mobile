import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: ReactNode;
  /** Sous-carte : fond `surface-soft`, pas d'ombre. */
  soft?: boolean;
  /** Padding interne (défaut 18). */
  pad?: number;
  /** Rayon (défaut 28 ; cartes secondaires 20). */
  radius?: number;
  className?: string;
}

/**
 * Conteneur de présentation. Ombre douce en clair, bordure hairline partout,
 * pas d'ombre en sombre. Padding/rayon via props (override fiable, NativeWind
 * n'ayant pas de tailwind-merge).
 */
export function Card({
  children,
  soft = false,
  pad = 18,
  radius = 28,
  className = '',
  style,
  ...rest
}: CardProps) {
  return (
    <View
      className={[
        'border border-black/5 dark:border-white/10',
        soft
          ? 'bg-surface-soft dark:bg-surface-softDark'
          : 'bg-surface-card dark:bg-surface-cardDark shadow-sm',
        className,
      ].join(' ')}
      style={[{ borderRadius: radius, padding: pad }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
