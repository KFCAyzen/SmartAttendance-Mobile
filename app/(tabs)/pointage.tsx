import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { humanizeApiError } from '~/api/client';
import { getHistory } from '~/api/attendance';
import type { FaceCheckInResponse } from '~/api/types';
import { Card } from '~/components/ui/Card';
import { useFaceCheckIn } from '~/hooks/useFaceCheckIn';
import { useLocation } from '~/hooks/useLocation';
import { formatTime } from '~/lib/date';

type Phase = 'idle' | 'scanning' | 'success';

const FRAME_W = 224;
const FRAME_H = 290;
const SITE_LABEL = 'Siège — Casablanca'; // TODO(api): site réel quand l'endpoint existe.

export default function PointageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [lastResult, setLastResult] = useState<FaceCheckInResponse | null>(null);
  const [statusText, setStatusText] = useState('');

  const checkIn = useFaceCheckIn();
  const { fetchCoords } = useLocation();

  // Loading must show the instant the user taps — takePictureAsync + GPS run
  // before the mutation, so relying on checkIn.isPending alone feels frozen.
  const busy = capturing || checkIn.isPending;

  // Statut du jour → titre arrivée/sortie (le type réel vient du résultat).
  const todayQuery = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => getHistory(1, 20),
  });
  const isOut = useMemo(() => {
    const items = todayQuery.data?.data ?? todayQuery.data?.attendances ?? [];
    const today = items
      .filter((i) => new Date(i.timestamp).toDateString() === new Date().toDateString())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return today[today.length - 1]?.type === 'CHECK_IN';
  }, [todayQuery.data]);

  const accent = isOut ? '#FF8A3D' : '#2F5BFF';

  // Activate the camera only while this tab is focused — avoids holding the camera in background.
  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      return () => {
        setCameraActive(false);
        setPhase('idle');
        setLastResult(null);
      };
    }, []),
  );

  // ── Animations ──────────────────────────────────────────────────────────
  const sweep = useSharedValue(0);
  const pulse = useSharedValue(1);
  const pop = useSharedValue(0);
  const rise = useSharedValue(0);

  useEffect(() => {
    if (phase === 'scanning') {
      sweep.value = 0;
      sweep.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      );
      pulse.value = withRepeat(withTiming(1.025, { duration: 800 }), -1, true);
    } else {
      cancelAnimation(sweep);
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 200 });
    }
    if (phase === 'success') {
      pop.value = 0;
      pop.value = withSpring(1, { damping: 9, stiffness: 140 });
      rise.value = withTiming(1, { duration: 350 });
    } else {
      pop.value = 0;
      rise.value = 0;
    }
  }, [phase, sweep, pulse, pop, rise]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(sweep.value, [0, 1], [-40, FRAME_H]) }],
    opacity: interpolate(sweep.value, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
  }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + pop.value * 0.4 }],
    opacity: Math.min(1, pop.value),
  }));
  const riseStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - rise.value) * 16 }],
    opacity: rise.value,
  }));

  // ── Status text cycling during scanning ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'scanning') {
      setStatusText(t('checkin.placeFace'));
      return;
    }
    setStatusText(t('checkin.detecting'));
    const t1 = setTimeout(() => setStatusText(t('checkin.analyzing')), 700);
    const t2 = setTimeout(() => setStatusText(t('checkin.verifying')), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase, t]);

  const handleCapture = async () => {
    if (!cameraRef.current || busy) return;
    setPhase('scanning');
    setCapturing(true);
    try {
      // Kick off location in parallel — it doesn't depend on the photo and is
      // the slowest step, so racing it with the capture cuts total wait time.
      const coordsPromise = fetchCoords();
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
        base64: false,
      });
      if (!photo?.uri) throw new Error(t('checkin.captureFailed'));
      const coords = await coordsPromise;
      const result = await checkIn.mutateAsync({ photoUri: photo.uri, coords });
      if (result.user) {
        setLastResult(result);
        setPhase('success');
        if (process.env.EXPO_OS === 'ios') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // Offline queued (or no identity) — info toast, back to idle.
        setPhase('idle');
        Toast.show({ type: 'success', text1: result.message ?? t('checkin.queued') });
      }
    } catch (error) {
      setLastResult(null);
      setPhase('idle');
      Toast.show({
        type: 'error',
        text1: t('checkin.rejected'),
        text2: humanizeApiError(error),
      });
    } finally {
      setCapturing(false);
    }
  };

  const handleDone = () => {
    setPhase('idle');
    setLastResult(null);
    router.navigate('/(tabs)');
  };

  // ── Permission states ─────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
        <View className="flex-1 items-center justify-center px-5">
          <Card className="w-full items-center gap-4">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="camera" size={36} color="#2F5BFF" />
            </View>
            <Text className="text-center font-display text-[22px] text-ink dark:text-white">
              {t('checkin.enableCamera')}
            </Text>
            <Text className="text-center font-body text-[14px] leading-5 text-muted dark:text-slate-400">
              {t('checkin.cameraPermissionMessage')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void requestPermission()}
              className="mt-1 w-full items-center justify-center rounded-[20px] bg-primary py-[15px] active:opacity-90"
            >
              <Text className="font-bodyBold text-[15px] text-white">
                {t('checkin.allowCamera')}
              </Text>
            </Pressable>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera + overlay ──────────────────────────────────────────────────────
  const isSuccess = phase === 'success';
  const ringColor = isSuccess
    ? '#16A34A'
    : phase === 'scanning'
      ? accent
      : 'rgba(255,255,255,0.35)';
  const att = lastResult?.attendance;
  const recordedOut = att ? att.type === 'CHECK_OUT' : isOut;
  const recordedTime = att?.timestamp ? formatTime(att.timestamp) : formatTime(new Date());
  const conf = att?.faceConfidence;
  const confPct =
    typeof conf === 'number' ? Math.round(conf <= 1 ? conf * 100 : conf) : null;
  const name = lastResult?.user?.name ?? '';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  return (
    <View className="flex-1 bg-black">
      {cameraActive ? (
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" mode="picture" />
      ) : (
        <View className="flex-1 bg-black" />
      )}

      {/* Scrim pour lisibilité du texte */}
      <View pointerEvents="none" className="absolute inset-0 bg-black/25" />

      {/* Header */}
      <SafeAreaView edges={['top']} className="absolute inset-x-0 top-0">
        <View className="flex-row items-center px-5 pt-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/(tabs)')}
            className="h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-white/12"
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View className="flex-1 items-center pr-[42px]">
            <Text className="font-bodyBold text-[11px] tracking-[1.6px] text-white/55">
              {t('checkin.eyebrow')}
            </Text>
            <Text className="mt-1 font-display text-[24px] text-white">
              {recordedOut ? t('checkin.titleOut') : t('checkin.titleIn')}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Cadre visage centré */}
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <Animated.View style={[{ width: FRAME_W, height: FRAME_H }, pulseStyle]}>
          {/* anneau + masque clippé */}
          <View
            style={{
              width: FRAME_W,
              height: FRAME_H,
              borderRadius: 130,
              borderWidth: 3,
              borderColor: ringColor,
              overflow: 'hidden',
              backgroundColor: 'rgba(20,28,48,0.18)',
            }}
          >
            {phase === 'scanning' ? (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 46,
                    backgroundColor: accent,
                    opacity: 0.22,
                    borderBottomWidth: 2,
                    borderBottomColor: accent,
                  },
                  sweepStyle,
                ]}
              />
            ) : null}
            {isSuccess ? (
              <View className="absolute inset-0 items-center justify-center bg-success/20">
                <Animated.View
                  style={popStyle}
                  className="h-[76px] w-[76px] items-center justify-center rounded-full bg-success"
                >
                  <Ionicons name="checkmark" size={42} color="#fff" />
                </Animated.View>
              </View>
            ) : null}
          </View>

          {/* coins / brackets */}
          {!isSuccess
            ? ([0, 1, 2, 3] as const).map((c) => {
                const top = c < 2;
                const left = c % 2 === 0;
                return (
                  <View
                    key={c}
                    style={{
                      position: 'absolute',
                      width: 26,
                      height: 26,
                      top: top ? -8 : undefined,
                      bottom: top ? undefined : -8,
                      left: left ? -8 : undefined,
                      right: left ? undefined : -8,
                      borderColor: phase === 'scanning' ? accent : 'rgba(255,255,255,0.6)',
                      borderTopWidth: top ? 3 : 0,
                      borderBottomWidth: top ? 0 : 3,
                      borderLeftWidth: left ? 3 : 0,
                      borderRightWidth: left ? 0 : 3,
                      borderTopLeftRadius: c === 0 ? 12 : 0,
                      borderTopRightRadius: c === 1 ? 12 : 0,
                      borderBottomLeftRadius: c === 2 ? 12 : 0,
                      borderBottomRightRadius: c === 3 ? 12 : 0,
                    }}
                  />
                );
              })
            : null}
        </Animated.View>

        <Text className="mt-7 px-8 text-center font-bodySemibold text-[14.5px] text-white/85">
          {isSuccess ? t('checkin.confirmed') : statusText}
        </Text>
      </View>

      {/* Bas */}
      <SafeAreaView edges={['bottom']} className="absolute inset-x-0 bottom-0">
        <View className="px-[18px] pb-3">
          {isSuccess ? (
            <Animated.View style={riseStyle}>
              <Card className="gap-3.5">
                <View className="flex-row items-center gap-3">
                  <LinearGradient
                    colors={['#2F5BFF', '#FF8A3D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      height: 48,
                      width: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 16,
                    }}
                  >
                    <Text className="font-display text-[18px] text-white">{initials || '–'}</Text>
                  </LinearGradient>
                  <View className="flex-1">
                    <Text className="font-display text-[17px] text-ink dark:text-white">
                      {name || '—'}
                    </Text>
                    {lastResult?.user?.department ? (
                      <Text className="font-body text-[12.5px] text-muted dark:text-slate-400">
                        {lastResult.user.department}
                      </Text>
                    ) : null}
                  </View>
                  {confPct != null ? (
                    <View className="flex-row items-center gap-1 self-start rounded-full bg-success/15 px-3 py-[5px]">
                      <Ionicons name="shield-checkmark" size={13} color="#16A34A" />
                      <Text className="font-bodyBold text-[11.5px] text-success">{confPct}%</Text>
                    </View>
                  ) : null}
                </View>
                <View className="h-px bg-black/5 dark:bg-white/10" />
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name={recordedOut ? 'arrow-up' : 'arrow-down'}
                      size={18}
                      color={recordedOut ? '#FF8A3D' : '#16A34A'}
                    />
                    <Text className="font-bodyBold text-[14px] text-ink dark:text-white">
                      {recordedOut
                        ? t('checkin.departureRecorded')
                        : t('checkin.arrivalRecorded')}
                    </Text>
                  </View>
                  <Text className="font-display text-[18px] text-ink dark:text-white">
                    {recordedTime}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="location-outline" size={14} color="#717A90" />
                  <Text className="font-body text-[12.5px] text-muted dark:text-slate-400">
                    {att?.location ?? SITE_LABEL} · {t('checkin.gpsVerified')}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleDone}
                  className="items-center justify-center rounded-[20px] bg-primary py-[15px] active:opacity-90"
                >
                  <Text className="font-bodyBold text-[15px] text-white">
                    {t('checkin.done')}
                  </Text>
                </Pressable>
              </Card>
            </Animated.View>
          ) : (
            <View className="items-center gap-4">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.6)" />
                <Text className="font-body text-[12.5px] text-white/60">{SITE_LABEL}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: busy, busy }}
                disabled={busy}
                onPress={handleCapture}
                className="h-[76px] w-[76px] items-center justify-center rounded-full"
                style={{ backgroundColor: busy ? 'rgba(255,255,255,0.25)' : '#fff' }}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View
                    className="h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: accent }}
                  >
                    <Ionicons name="scan" size={26} color="#fff" />
                  </View>
                )}
              </Pressable>
              <Text className="font-body text-[12px] text-white/45">
                {busy ? statusText : t('checkin.tapToScan')}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
