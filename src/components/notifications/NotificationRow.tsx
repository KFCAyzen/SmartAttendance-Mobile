import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { NotificationView } from '~/lib/notifications';

import { IconTile } from './IconTile';

/** Point ambré « non lu » avec un léger battement (shimmer). */
function UnreadDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.55, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      false,
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width: 7, height: 7, borderRadius: 999, backgroundColor: '#FF8A3D' }, style]}
    />
  );
}

export function NotificationRow({
  n,
  timeline = true,
  last,
  linkLabel,
  onPress,
  onLink,
}: {
  n: NotificationView;
  timeline?: boolean;
  last: boolean;
  linkLabel?: string;
  onPress: (n: NotificationView) => void;
  onLink: (n: NotificationView) => void;
}) {
  const dim = !n.unread;
  return (
    <Pressable
      disabled={!n.unread}
      onPress={() => onPress(n)}
      className="flex-row gap-[13px]"
      style={{ paddingLeft: timeline ? 4 : 0 }}
    >
      {timeline ? (
        <View style={{ width: 44, alignItems: 'center' }}>
          {!last ? (
            <View
              className="bg-black/5 dark:bg-white/10"
              style={{ position: 'absolute', top: 44, bottom: -16, width: 2, borderRadius: 2 }}
            />
          ) : null}
          <IconTile icon={n.icon} tone={n.tone} size={44} dim={dim} />
        </View>
      ) : (
        <IconTile icon={n.icon} tone={n.tone} size={42} dim={dim} />
      )}

      <View
        className={`min-w-0 flex-1 ${timeline || last ? '' : 'border-b border-black/5 dark:border-white/10'}`}
        style={{ paddingBottom: timeline ? 16 : 0 }}
      >
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-[7px]">
            {n.unread ? <UnreadDot /> : null}
            <Text
              numberOfLines={1}
              className={`min-w-0 flex-1 text-[14.5px] ${
                n.unread ? 'font-display text-ink dark:text-white' : 'font-bodySemibold text-muted'
              }`}
            >
              {n.title}
            </Text>
          </View>
          <Text className="font-bodySemibold text-[11px] text-[#9AA2B5] dark:text-[#67718C]">
            {n.time}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          className={`mt-[3px] font-body text-[12.6px] leading-[18px] ${
            dim ? 'text-[#9AA2B5] dark:text-[#67718C]' : 'text-muted dark:text-[#9AA5BE]'
          }`}
        >
          {n.message}
        </Text>
        {n.link ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onLink(n)}
            className="mt-2 flex-row items-center gap-1 self-start"
          >
            <Text className="font-bodyBold text-[12.5px] text-primary">{linkLabel}</Text>
            <Ionicons name="chevron-forward" size={13} color="#2F5BFF" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}
