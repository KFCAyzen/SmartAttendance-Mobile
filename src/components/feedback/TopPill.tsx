/* TopPill.tsx — compact passive-feedback pill.
   Drops from the top with a slight spring overshoot, slides back up to dismiss.
   Swipe up to dismiss early; auto-dismisses after `duration`. */

import { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, useColorScheme } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { getTokens, PILL_ICON } from './tokens';
import type { ToastItem } from './types';

const HIDDEN = -140;

export function TopPill({
  item,
  topInset,
  onClose,
}: {
  item: ToastItem;
  topInset: number;
  onClose: (id: number) => void;
}) {
  const dark = useColorScheme() === 'dark';
  const t = getTokens(dark);
  const cfg = PILL_ICON[item.type ?? 'info'];

  const ty = useSharedValue(HIDDEN);
  const op = useSharedValue(0);

  const close = () => {
    op.value = withTiming(0, { duration: 180 });
    ty.value = withTiming(HIDDEN, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onClose)(item.id);
    });
  };

  useEffect(() => {
    ty.value = withSpring(0, { damping: 15, stiffness: 190, mass: 0.7 });
    op.value = withTiming(1, { duration: 160 });
    const timer = setTimeout(() => close(), item.duration ?? 2800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < 0) ty.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY < -24) runOnJS(close)();
      else ty.value = withSpring(0, { damping: 16, stiffness: 200 });
    });

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
    opacity: op.value,
  }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: topInset + 6 }]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={aStyle}>
          <Pressable
            onPress={() => close()}
            style={[styles.pill, { backgroundColor: t.surface, borderColor: t.line, shadowColor: t.shadowColor }]}
          >
            <Ionicons name={cfg.icon} size={19} color={cfg.color} />
            <Text numberOfLines={1} style={[styles.text, { color: t.ink }]}>
              {item.title}
            </Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    maxWidth: '100%',
    paddingVertical: 9,
    paddingLeft: 13,
    paddingRight: 16,
    borderRadius: 999,
    borderWidth: 1,
    // soft elevation
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  text: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13.5, letterSpacing: -0.1, flexShrink: 1 },
});
