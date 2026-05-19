import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

interface DateFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  error?: string;
}

export function DateField({ label, value, onChange, minimumDate, error }: DateFieldProps) {
  const [open, setOpen] = useState(false);

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
          {format(value, 'EEEE d MMMM yyyy', { locale: fr })}
        </Text>
        <Ionicons name="calendar" size={18} color="#64748B" />
      </Pressable>
      {error ? <Text className="text-xs text-danger">{error}</Text> : null}

      {open ? (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate}
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setOpen(false);
            if (selected) onChange(selected);
          }}
        />
      ) : null}
    </View>
  );
}
