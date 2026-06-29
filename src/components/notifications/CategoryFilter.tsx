import { Pressable, ScrollView, Text, View } from 'react-native';

import type { NotificationCategory } from '~/lib/notifications';

export type FilterKey = 'all' | NotificationCategory;

const KEYS: FilterKey[] = ['all', 'pointage', 'conges', 'securite'];

export function CategoryFilter({
  value,
  onChange,
  counts,
  labels,
}: {
  value: FilterKey;
  onChange: (k: FilterKey) => void;
  counts: Record<FilterKey, number>;
  labels: Record<FilterKey, string>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
    >
      {KEYS.map((k) => {
        const on = value === k;
        const cnt = counts[k] ?? 0;
        return (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(k)}
            className={`flex-row items-center rounded-full border px-[14px] py-[9px] ${
              on
                ? 'border-transparent bg-ink dark:bg-white'
                : 'border-black/5 bg-surface-card dark:border-white/10 dark:bg-surface-cardDark'
            }`}
          >
            <Text
              className={`font-bodyBold text-[12.5px] ${
                on ? 'text-white dark:text-ink' : 'text-muted'
              }`}
            >
              {labels[k]}
            </Text>
            {cnt > 0 ? (
              <View
                className="ml-[7px] h-[17px] min-w-[17px] items-center justify-center rounded-full px-[5px]"
                style={{ backgroundColor: on ? 'rgba(255,255,255,0.9)' : 'rgba(47,91,255,0.12)' }}
              >
                <Text
                  className={`font-bodyBold text-[10.5px] ${on ? 'text-ink' : 'text-primary'}`}
                >
                  {cnt}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
