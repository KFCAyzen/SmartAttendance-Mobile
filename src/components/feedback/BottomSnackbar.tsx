/* BottomSnackbar.tsx — Material/WhatsApp-style bottom bar for reversible actions.
   Rises from the bottom, "ANNULER" action, swipe (sideways or down) to dismiss. */

import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { getTokens, SNACK_RADIUS } from './tokens';
import type { SnackItem } from './types';

const HIDDEN = 160;

export function BottomSnackbar({
  item,
  bottomInset,
  onClose,
}: {
  item: SnackItem;
  bottomInset: number;
  onClose: (id: number) => void;
}) {
  const dark = useColorScheme() === 'dark';
  const t = getTokens(dark);

  const tx = useSharedValue(0);
  const ty = useSharedValue(HIDDEN);
  const op = useSharedValue(0);

  const close = () => {
    op.value = withTiming(0, { duration: 200 });
    ty.value = withTiming(HIDDEN, { duration: 260 }, (finished) => {
      if (finished) runOnJS(onClose)(item.id);
    });
  };

  useEffect(() => {
    ty.value = withSpring(0, { damping: 18, stiffness: 170 });
    op.value = withTiming(1, { duration: 180 });
    const timer = setTimeout(() => close(), item.duration ?? 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 90 || e.translationY > 50) runOnJS(close)();
      else {
        tx.value = withSpring(0);
        ty.value = withSpring(0);
      }
    });

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    opacity: op.value,
  }));

  const handleUndo = () => {
    item.onUndo?.();
    close();
  };

  const hasAction = !!item.onUndo || !!item.actionLabel;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: bottomInset + (Platform.OS === 'android' ? 12 : 18) }]}
    >
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.bar,
            { backgroundColor: t.barBg, borderRadius: SNACK_RADIUS, paddingRight: hasAction ? 8 : 18 },
            aStyle,
          ]}
        >
          <Text numberOfLines={1} style={[styles.text, { color: t.barText }]}>
            {item.title}
          </Text>
          {hasAction && (
            <Pressable onPress={handleUndo} hitSlop={8} style={styles.action}>
              <Text style={[styles.actionText, { color: t.action }]}>
                {(item.actionLabel ?? 'Annuler').toUpperCase()}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 12 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 480,
    minHeight: 50,
    paddingVertical: 11,
    paddingLeft: 18,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  text: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14.5, letterSpacing: -0.1 },
  action: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 9 },
  actionText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13.5, letterSpacing: 0.3 },
});
