import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const CANVAS = '#070A14';

// Drifting blurred blobs — the signature ambient glow of the login canvas.
const BLOBS = [
  { id: 'p', color: '#2F5BFF', top: -70, left: -90, dx: 46, dy: 34, dur: 15000 },
  { id: 'a', color: '#FF8A3D', top: 430, left: 150, dx: -54, dy: -42, dur: 18000 },
  { id: 'v', color: '#6E5BFF', top: 200, left: 70, dx: 34, dy: -52, dur: 21000 },
];

function Blob({ id, color, top, left, dx, dy, dur }: (typeof BLOBS)[number]) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: dur, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [t, dur]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * dx },
      { translateY: t.value * dy },
      { scale: 0.9 + t.value * 0.2 },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top, left, width: 360, height: 360, opacity: 0.5 }, style]}
    >
      <Svg width={360} height={360}>
        <Defs>
          <RadialGradient id={`blob-${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.85} />
            <Stop offset="70%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={180} cy={180} r={180} fill={`url(#blob-${id})`} />
      </Svg>
    </Animated.View>
  );
}

export function AuthAura({ on = true }: { on?: boolean }) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: CANVAS, overflow: 'hidden' }]}>
      {/* Faint grid */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
        <Defs>
          <Pattern id="grid" width={42} height={42} patternUnits="userSpaceOnUse">
            <Path d="M42 0 L0 0 0 42" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#grid)" />
      </Svg>

      {on ? BLOBS.map((b) => <Blob key={b.id} {...b} />) : null}

      {/* Vignette — darkens edges so foreground text stays legible */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
        <Defs>
          <RadialGradient id="vign" cx="50%" cy="0%" r="120%">
            <Stop offset="42%" stopColor="#04060E" stopOpacity={0} />
            <Stop offset="100%" stopColor="#04060E" stopOpacity={0.78} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#vign)" />
      </Svg>
    </View>
  );
}
