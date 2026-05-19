import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helper, className, ...rest },
  ref,
) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#94A3B8"
        className={[
          'h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-white',
          error ? 'border-danger' : '',
          className ?? '',
        ].join(' ')}
        {...rest}
      />
      {error ? (
        <Text className="text-xs text-danger">{error}</Text>
      ) : helper ? (
        <Text className="text-xs text-slate-500 dark:text-slate-400">{helper}</Text>
      ) : null}
    </View>
  );
});
