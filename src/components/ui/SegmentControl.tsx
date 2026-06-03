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
    <View className="flex-row rounded-[20px] border border-black/5 bg-surface-soft p-1 dark:border-white/10 dark:bg-surface-softDark">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            className={`h-10 flex-1 items-center justify-center rounded-[14px] ${
              active ? 'bg-surface-card shadow-sm dark:bg-surface-cardDark' : ''
            }`}
          >
            <Text
              className={`text-sm ${
                active
                  ? 'font-bodyBold text-ink dark:text-white'
                  : 'font-bodySemibold text-muted dark:text-slate-400'
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
