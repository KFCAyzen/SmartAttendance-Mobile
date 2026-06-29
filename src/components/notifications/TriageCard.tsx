import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOutRight, LinearTransition } from 'react-native-reanimated';

import type { NotificationView } from '~/lib/notifications';

import { IconTile, TONE_COLOR } from './IconTile';

export function TriageCard({
  n,
  actionLabel,
  ignoreLabel,
  onAction,
  onIgnore,
}: {
  n: NotificationView;
  actionLabel: string;
  ignoreLabel: string;
  onAction: (n: NotificationView) => void;
  onIgnore: (n: NotificationView) => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOutRight.duration(300)}
      layout={LinearTransition}
      className="flex-row gap-[13px] rounded-[28px] border border-black/5 bg-surface-card p-[15px] dark:border-white/10 dark:bg-surface-cardDark"
      style={{
        shadowColor: '#141E46',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      }}
    >
      <IconTile icon={n.icon} tone={n.tone} size={44} />
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text numberOfLines={1} className="flex-1 font-display text-[15.5px] text-ink dark:text-white">
            {n.title}
          </Text>
          <Text className="font-bodySemibold text-[11.5px] text-[#9AA2B5] dark:text-[#67718C]">
            {n.time}
          </Text>
        </View>
        <Text className="mt-1 font-body text-[12.8px] leading-[18px] text-muted dark:text-[#9AA5BE]">
          {n.message}
        </Text>
        <View className="mt-3 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => onAction(n)}
            className="flex-row items-center gap-1.5 rounded-full px-4 py-[9px]"
            style={{ backgroundColor: TONE_COLOR[n.actionTone ?? n.tone] }}
          >
            <Text className="font-bodyBold text-[12.5px] text-white">{actionLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onIgnore(n)}
            className="rounded-full border border-black/10 px-[14px] py-[9px] dark:border-white/15"
          >
            <Text className="font-bodyBold text-[12.5px] text-muted">{ignoreLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
