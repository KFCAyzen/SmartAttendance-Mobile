import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface SelectProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  error?: string;
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className={`h-12 rounded-2xl border bg-white dark:bg-slate-900 px-4 flex-row items-center justify-between ${
          error ? 'border-danger' : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <Text className="text-base text-slate-900 dark:text-white">
          {current?.label ?? 'Choisir…'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748B" />
      </Pressable>
      {error ? <Text className="text-xs text-danger">{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          <Pressable className="bg-white dark:bg-slate-900 rounded-t-3xl pt-3 pb-8">
            <View className="h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-700 self-center mb-3" />
            <ScrollView className="max-h-96">
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`px-6 py-4 flex-row items-center justify-between ${
                      active ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        active
                          ? 'font-semibold text-primary-700 dark:text-primary-100'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {opt.label}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={20} color="#1E40AF" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
