import { Pressable, Text, View } from 'react-native';

interface SegmentControlProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function SegmentControl<T extends string>({
  value,
  options,
  onChange,
}: SegmentControlProps<T>) {
  return (
    <View className="flex-row rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            className={`flex-1 h-10 rounded-xl items-center justify-center ${
              active ? 'bg-white dark:bg-slate-900 shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                active
                  ? 'text-primary-700 dark:text-primary-100'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
