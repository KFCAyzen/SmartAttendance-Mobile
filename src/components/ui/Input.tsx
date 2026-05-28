import { forwardRef } from 'react';
import { Text, TextInput, View, Pressable, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helper, className, showPasswordToggle, isPasswordVisible, onTogglePassword, ...rest },
  ref,
) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {label}
        </Text>
      ) : null}
      <View className="relative">
        <TextInput
          ref={ref}
          placeholderTextColor="#94A3B8"
          className={[
            'h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900',
            'dark:border-slate-700 dark:bg-slate-900 dark:text-white',
            error ? 'border-danger' : '',
            showPasswordToggle ? 'pr-12' : '',
            className ?? '',
          ].join(' ')}
          {...rest}
        />
        {showPasswordToggle && onTogglePassword ? (
          <Pressable
            onPress={onTogglePassword}
            className="absolute right-0 top-0 h-12 w-12 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#64748B"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="text-xs text-danger">{error}</Text>
      ) : helper ? (
        <Text className="text-xs text-slate-500 dark:text-slate-400">{helper}</Text>
      ) : null}
    </View>
  );
});
