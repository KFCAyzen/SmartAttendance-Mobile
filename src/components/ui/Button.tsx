import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary active:bg-primary-700',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700',
    text: 'text-slate-900 dark:text-white',
  },
  ghost: {
    container: 'bg-transparent active:bg-slate-100 dark:active:bg-slate-800',
    text: 'text-primary-700 dark:text-primary-100',
  },
  danger: {
    container: 'bg-danger active:opacity-80',
    text: 'text-white',
  },
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  className,
  ...rest
}: ButtonProps & { className?: string }) {
  const v = variantClasses[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={[
        'h-12 rounded-2xl items-center justify-center px-5',
        v.container,
        fullWidth ? 'self-stretch' : 'self-start',
        isDisabled ? 'opacity-60' : '',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#3B82F6' : '#fff'} />
      ) : (
        <Text className={`text-base font-semibold ${v.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
