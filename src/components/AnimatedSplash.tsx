import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Geometry lives on a 1024 grid (viewBox), rendered at 132px. Stroke lengths are
// hardcoded because runtime getTotalLength() is unreliable on native.
const MARK = 132;
const BRACKETS_LEN = 1119; // ≈ total length of the four scan-bracket sub-paths
const SMILE_LEN = 150;
const EYE_R = 27;

const BRACKETS_D =
  'M 300 458 L 300 396 Q 300 300 396 300 L 458 300 ' +
  'M 724 458 L 724 396 Q 724 300 628 300 L 566 300 ' +
  'M 300 566 L 300 628 Q 300 724 396 724 L 458 724 ' +
  'M 724 566 L 724 628 Q 724 724 628 724 L 566 724';

const E_OUT_EXPO = Easing.bezier(0.22, 1, 0.36, 1);

type Props = {
  /** Splash stays until the app reports ready *and* the reveal has finished. */
  appReady: boolean;
  /** Called once the fade-out completes — parent should unmount the splash. */
  onFinish: () => void;
};

export function AnimatedSplash({ appReady, onFinish }: Props) {
  const { width, height } = useWindowDimensions();
  const [revealDone, setRevealDone] = useState(false);

  // Reveal timeline
  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.92);
  const halo = useSharedValue(0);
  const brk = useSharedValue(BRACKETS_LEN);
  const scan = useSharedValue(0);
  const eyeL = useSharedValue(0);
  const eyeR = useSharedValue(0);
  const smile = useSharedValue(SMILE_LEN);
  const word = useSharedValue(0);
  const foot = useSharedValue(0);
  const loader = useSharedValue(0);
  const root = useSharedValue(1);

  const [scanOn, setScanOn] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        // Render the final composition immediately; skip the scan sweep.
        setScanOn(false);
        markOpacity.value = 1;
        markScale.value = 1;
        halo.value = 0.85;
        brk.value = 0;
        eyeL.value = EYE_R;
        eyeR.value = EYE_R;
        smile.value = 0;
        word.value = 1;
        foot.value = 1;
        loader.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
        setRevealDone(true);
        return;
      }

      // 1 — Mark group fades + scales in.
      markOpacity.value = withDelay(100, withTiming(1, { duration: 1000, easing: E_OUT_EXPO }));
      markScale.value = withDelay(100, withTiming(1, { duration: 1000, easing: E_OUT_EXPO }));
      // 2 — Halo bloom.
      halo.value = withDelay(500, withTiming(0.85, { duration: 1400, easing: Easing.out(Easing.ease) }));
      // 3 — Brackets draw on.
      brk.value = withDelay(350, withTiming(0, { duration: 1050, easing: Easing.bezier(0.7, 0, 0.2, 1) }));
      // 4 — Scan sweep, two passes.
      scan.value = withDelay(
        550,
        withRepeat(withTiming(1, { duration: 1500, easing: Easing.bezier(0.5, 0, 0.5, 1) }), 2, false),
      );
      // 5 — Eyes pop with overshoot.
      eyeL.value = withDelay(1180, withTiming(EYE_R, { duration: 500, easing: Easing.bezier(0.34, 1.6, 0.5, 1) }));
      eyeR.value = withDelay(1260, withTiming(EYE_R, { duration: 500, easing: Easing.bezier(0.34, 1.6, 0.5, 1) }));
      // 6 — Smile draws on.
      smile.value = withDelay(1340, withTiming(0, { duration: 550, easing: Easing.bezier(0.6, 0, 0.3, 1) }));
      // 7 — Wordmark rises.
      word.value = withDelay(1500, withTiming(1, { duration: 900, easing: E_OUT_EXPO }));
      // 8 — Footer rises.
      foot.value = withDelay(1800, withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) }));
      // 9 — Loader fill loops (indeterminate).
      loader.value = withDelay(
        1950,
        withRepeat(withTiming(1, { duration: 1500, easing: Easing.bezier(0.65, 0, 0.35, 1) }), -1, false),
      );

      revealTimer = setTimeout(() => setRevealDone(true), 2700);
    });
    return () => {
      cancelled = true;
      if (revealTimer) clearTimeout(revealTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hand off from the native splash the instant our first frame is laid out.
  const onLayout = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);

  // Fade out once app + reveal are both done.
  useEffect(() => {
    if (appReady && revealDone) {
      root.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appReady, revealDone]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: root.value }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: halo.value }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 14 }],
  }));
  const footStyle = useAnimatedStyle(() => ({
    opacity: foot.value,
    transform: [{ translateY: (1 - foot.value) * 14 }],
  }));
  const loaderStyle = useAnimatedStyle(() => ({
    // pill (40% of track) slides from off-left to off-right
    transform: [{ translateX: -61 + 276 * loader.value }],
  }));

  const brkProps = useAnimatedProps(() => ({ strokeDashoffset: brk.value }));
  const smileProps = useAnimatedProps(() => ({ strokeDashoffset: smile.value }));
  const eyeLProps = useAnimatedProps(() => ({ r: eyeL.value }));
  const eyeRProps = useAnimatedProps(() => ({ r: eyeR.value }));
  const scanProps = useAnimatedProps(() => {
    const p = scan.value;
    let o = 1;
    if (p < 0.12) o = p / 0.12;
    else if (p > 0.88) o = (1 - p) / 0.12;
    return { y: 170 + 360 * p, opacity: o };
  });

  return (
    <Animated.View
      pointerEvents="auto"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, styles.root, rootStyle]}
    >
      <StatusBar style="light" />
      {/* Base navy gradient */}
      <LinearGradient
        colors={['#2A356A', '#1B2350', '#121A3C', '#0A0E22']}
        locations={[0, 0.34, 0.64, 1]}
        start={{ x: 0.32, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Violet bloom + bottom vignette */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
        <Defs>
          <RadialGradient
            id="bloom"
            cx={width * 0.5}
            cy={height * 0.38}
            r={width * 0.62}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#7E5BFF" stopOpacity={0.22} />
            <Stop offset="1" stopColor="#7E5BFF" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="vign"
            cx={width * 0.5}
            cy={height * 1.12}
            r={height * 0.7}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#000000" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#bloom)" />
        <Rect width={width} height={height} fill="url(#vign)" />
      </Svg>

      {/* Center cluster */}
      <View style={styles.center} pointerEvents="none">
        <Animated.View style={markStyle}>
          {/* Halo behind the mark */}
          <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none">
            <Svg width={MARK * 1.7} height={MARK * 1.7}>
              <Defs>
                <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#6E5BFF" stopOpacity={0.45} />
                  <Stop offset="0.6" stopColor="#6E5BFF" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={MARK * 0.85} cy={MARK * 0.85} r={MARK * 0.85} fill="url(#halo)" />
            </Svg>
          </Animated.View>

          <Svg width={MARK} height={MARK} viewBox="0 0 1024 1024">
            <Defs>
              <SvgLinearGradient id="brg" x1="0.1" y1="0" x2="0.9" y2="1">
                <Stop offset="0" stopColor="#4470FF" />
                <Stop offset="1" stopColor="#7E5BFF" />
              </SvgLinearGradient>
              <SvgLinearGradient id="scanG" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#8FA9FF" stopOpacity={0} />
                <Stop offset="0.5" stopColor="#9FB4FF" stopOpacity={0.95} />
                <Stop offset="1" stopColor="#8FA9FF" stopOpacity={0} />
              </SvgLinearGradient>
              <ClipPath id="frameClip">
                <Rect x={298} y={298} width={428} height={428} />
              </ClipPath>
            </Defs>

            {/* Scan sweep, clipped to the frame interior */}
            {scanOn ? (
              <G clipPath="url(#frameClip)">
                <AnimatedRect
                  x={298}
                  width={428}
                  height={20}
                  rx={10}
                  fill="url(#scanG)"
                  animatedProps={scanProps}
                />
              </G>
            ) : null}

            {/* Four scan brackets */}
            <AnimatedPath
              d={BRACKETS_D}
              fill="none"
              stroke="url(#brg)"
              strokeWidth={54}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={BRACKETS_LEN}
              animatedProps={brkProps}
            />

            {/* Face */}
            <AnimatedCircle cx={464} cy={486} fill="#fff" animatedProps={eyeLProps} />
            <AnimatedCircle cx={560} cy={486} fill="#fff" animatedProps={eyeRProps} />
            <AnimatedPath
              d="M 452 552 Q 512 608 572 552"
              fill="none"
              stroke="#fff"
              strokeWidth={36}
              strokeLinecap="round"
              strokeDasharray={SMILE_LEN}
              animatedProps={smileProps}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.wordmark, wordStyle]}>
          <Text style={styles.title}>
            Smart<Text style={styles.titleAccent}>Attendance</Text>
          </Text>
          <Text style={styles.tagline}>Pointage par reconnaissance faciale</Text>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View style={[styles.foot, footStyle]} pointerEvents="none">
        <View style={styles.track}>
          <Animated.View style={[styles.trackFillWrap, loaderStyle]}>
            <LinearGradient
              colors={['#4470FF', '#7E5BFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <View style={styles.brandline}>
          <LinearGradient
            colors={['#4470FF', '#7E5BFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dot}
          />
          <Text style={styles.brandText}>Présence, simplifiée</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#0A0E22' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    top: -MARK * 0.35,
    left: -MARK * 0.35,
    width: MARK * 1.7,
    height: MARK * 1.7,
  },
  wordmark: { marginTop: 46, alignItems: 'center' },
  title: {
    fontFamily: 'BricolageGrotesque_700Bold',
    fontSize: 33,
    letterSpacing: -0.6,
    color: '#fff',
  },
  titleAccent: { color: '#B9A5FF' },
  tagline: {
    marginTop: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.6)',
  },
  foot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 52,
    alignItems: 'center',
  },
  track: {
    width: 128,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  trackFillWrap: {
    width: 51,
    height: 3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  brandline: { marginTop: 22, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 7 },
  brandText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.42)',
  },
});
