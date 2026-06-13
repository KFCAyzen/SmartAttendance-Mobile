import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { z } from 'zod';

import { getMe } from '~/api/auth';
import { humanizeApiError } from '~/api/client';
import { feedback } from '~/components/feedback';
import {
  AuthField,
  AuthScreen,
  BrandMark,
  C,
  FONT,
  PrimaryButton,
} from '~/components/login/auth-ui';
import { useAuth } from '~/hooks/useAuth';
import {
  clearBiometricSession,
  getBiometricSession,
  getBiometricSupport,
  promptBiometric,
  saveBiometricSession,
  type BiometricSupport,
} from '~/lib/biometric';
import { clearAuth, setItem, StorageKeys } from '~/lib/secure-storage';
import { useAuthStore } from '~/stores/auth.store';

type Method = 'face' | 'pwd';

// ── Mode toggle (Face ID ⇄ Identifiants) ────────────────────────────────────
function ModeToggle({ value, onChange }: { value: Method; onChange: (m: Method) => void }) {
  const { t } = useTranslation();
  const [w, setW] = useState(0);
  const idx = value === 'face' ? 0 : 1;
  const thumbW = w > 0 ? (w - 10) / 2 : 0;
  const tx = useSharedValue(idx);
  useEffect(() => {
    tx.value = withTiming(idx, { duration: 280, easing: Easing.bezier(0.3, 0.7, 0.4, 1) });
  }, [idx, tx]);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value * thumbW }] }));

  const opts: { key: Method; label: string }[] = [
    { key: 'face', label: t('auth.login.methodFace') },
    { key: 'pwd', label: t('auth.login.methodPwd') },
  ];

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        padding: 5,
        borderRadius: 16,
        backgroundColor: C.glass,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      {thumbW > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 5,
              bottom: 5,
              left: 5,
              width: thumbW,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.95)',
              shadowColor: '#000',
              shadowOpacity: 0.28,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 6 },
              elevation: 5,
            },
            thumbStyle,
          ]}
        />
      ) : null}
      {opts.map((o) => {
        const on = value === o.key;
        const color = on ? C.ink : C.w62;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            onPress={() => onChange(o.key)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              paddingVertical: 11,
              borderRadius: 12,
            }}
          >
            {o.key === 'face' ? (
              <MaterialCommunityIcons name="face-recognition" size={17} color={color} />
            ) : (
              <Ionicons name="lock-closed" size={16} color={color} />
            )}
            <Text style={{ fontFamily: FONT.bold, fontSize: 13.5, color }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Face ID hero auth (real device biometric) ───────────────────────────────
function FaceAuth({ onNeedCredentials }: { onNeedCredentials: () => void }) {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [support, setSupport] = useState<BiometricSupport | null>(null);
  const [session, setSession2] = useState<Awaited<ReturnType<typeof getBiometricSession>>>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [sup, sess] = await Promise.all([getBiometricSupport(), getBiometricSession()]);
      if (!active) return;
      setSupport(sup);
      setSession2(sess);
    })();
    return () => {
      active = false;
    };
  }, []);

  // ── Orb animations ──
  const rot = useSharedValue(0);
  const pulse = useSharedValue(1);
  const sweep = useSharedValue(0);
  const pop = useSharedValue(0);
  useEffect(() => {
    if (phase === 'scanning') {
      rot.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.linear }), -1, false);
      pulse.value = withRepeat(withTiming(1.04, { duration: 800 }), -1, true);
      sweep.value = 0;
      sweep.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rot);
      cancelAnimation(pulse);
      cancelAnimation(sweep);
      pulse.value = withTiming(1, { duration: 200 });
    }
    if (phase === 'success') {
      pop.value = 0;
      pop.value = withSpring(1, { damping: 9, stiffness: 140 });
    } else {
      pop.value = 0;
    }
  }, [phase, rot, pulse, sweep, pop]);

  const arcStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value * 360}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(sweep.value, [0, 1], [-66, 66]) }],
    opacity: interpolate(sweep.value, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
  }));
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + pop.value * 0.6 }],
    opacity: Math.min(1, pop.value),
  }));

  const success = phase === 'success';
  const idleStatus = !support
    ? ''
    : !support.available
      ? t('auth.face.unavailable')
      : !session
        ? t('auth.face.noSession')
        : t('auth.face.tapToAuth');
  const status =
    phase === 'scanning' ? t('auth.face.scanning') : success ? t('auth.face.confirmed') : idleStatus;

  const onTap = async () => {
    if (phase !== 'idle') return;
    if (!support?.available || !session) {
      onNeedCredentials();
      return;
    }
    setPhase('scanning');
    try {
      const ok = await promptBiometric(t('auth.face.reason'), t('auth.face.cancel'));
      if (!ok) {
        setPhase('idle');
        feedback.error(t('auth.face.failed'));
        return;
      }
      // Restore + validate the stored token before committing the session.
      await setItem(StorageKeys.AccessToken, session.token);
      const me = await getMe();
      setPhase('success');
      await new Promise((r) => setTimeout(r, 480));
      await setSession(session.token, me); // → verifyDevice → root gate navigates
    } catch (error) {
      setPhase('idle');
      await clearBiometricSession();
      await clearAuth();
      feedback.error(t('auth.face.expired'), humanizeApiError(error));
      onNeedCredentials();
    }
  };

  const initials = session?.user
    ? `${session.user.firstName?.[0] ?? ''}${session.user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <View style={{ alignItems: 'center', gap: 26, paddingTop: 14 }}>
      <View style={{ width: 224, height: 224, alignItems: 'center', justifyContent: 'center' }}>
        {phase === 'idle' ? [0, 1, 2].map((i) => <PulseRing key={i} delay={i * 850} />) : null}

        {phase === 'scanning' ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 196,
                height: 196,
                borderRadius: 98,
                borderWidth: 3,
                borderColor: 'transparent',
                borderTopColor: C.primary,
                borderRightColor: 'rgba(47,91,255,0.4)',
              },
              arcStyle,
            ]}
          />
        ) : null}

        {/* glow halo */}
        <View
          style={{
            position: 'absolute',
            width: 168,
            height: 168,
            borderRadius: 84,
            backgroundColor: success ? 'rgba(22,163,74,0.22)' : 'rgba(47,91,255,0.2)',
          }}
        />

        <Pressable onPress={onTap} disabled={phase !== 'idle'} accessibilityRole="button">
          <Animated.View
            style={[
              {
                width: 132,
                height: 132,
                borderRadius: 66,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.16)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                shadowColor: success ? C.success : phase === 'scanning' ? C.primary : '#000',
                shadowOpacity: phase === 'idle' ? 0.5 : 0.45,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 12 },
                elevation: 10,
              },
              pulseStyle,
            ]}
          >
            <LinearGradient
              colors={['rgba(40,52,82,0.95)', 'rgba(16,22,38,0.96)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: 'absolute', width: 132, height: 132 }}
            />
            {!success ? (
              <MaterialCommunityIcons
                name="face-recognition"
                size={54}
                color="rgba(255,255,255,0.92)"
              />
            ) : null}
            {phase === 'scanning' ? (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 44,
                    backgroundColor: 'rgba(47,91,255,0.45)',
                  },
                  sweepStyle,
                ]}
              />
            ) : null}
            {success ? (
              <Animated.View
                style={[
                  {
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: C.success,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  popStyle,
                ]}
              >
                <Ionicons name="checkmark" size={38} color={C.white} />
              </Animated.View>
            ) : null}
          </Animated.View>
        </Pressable>
      </View>

      <View style={{ alignItems: 'center', gap: 12, minHeight: 70 }}>
        <Text
          style={{
            fontFamily: FONT.semibold,
            fontSize: 15,
            textAlign: 'center',
            color: success ? C.success : 'rgba(255,255,255,0.9)',
          }}
        >
          {status}
        </Text>
        {session?.user ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 8,
              paddingLeft: 8,
              paddingRight: 14,
              borderRadius: 999,
              backgroundColor: C.glass,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <LinearGradient
              colors={[C.primary, '#6E5BFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: FONT.display, fontSize: 12, color: C.white }}>{initials}</Text>
            </LinearGradient>
            <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
              {session.user.firstName} {session.user.lastName}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function PulseRing({ delay }: { delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.ease) }), -1, false),
    );
  }, [v, delay]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.55 + v.value * 1.15 }],
    opacity: 0.6 * (1 - v.value),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: 150,
          height: 150,
          borderRadius: 75,
          borderWidth: 1.5,
          borderColor: 'rgba(47,91,255,0.65)',
        },
        style,
      ]}
    />
  );
}

// ── Credentials form (real login + biometric enrolment) ─────────────────────
type FormValues = { email: string; password: string };

function CredForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  const schema = z.object({
    email: z.string().email(t('common.emailInvalid')),
    password: z.string().min(1, t('auth.login.passwordRequired')),
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await login.mutateAsync(values);
      if (remember) await saveBiometricSession(res.accessToken, res.user);
      else await clearBiometricSession();
      // Navigation handled by the root auth gate (device verification result).
    } catch (error) {
      feedback.error(t('auth.errors.invalidCredentials'), humanizeApiError(error));
    }
  });

  return (
    <View style={{ gap: 12 }}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <AuthField
            icon="mail-outline"
            label={t('auth.login.email')}
            value={value}
            onChange={onChange}
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <AuthField
            icon="lock-closed-outline"
            label={t('auth.login.password')}
            value={value}
            onChange={onChange}
            secure={!show}
            autoComplete="password"
            error={errors.password?.message}
            trailing={
              <Pressable
                accessibilityRole="button"
                onPress={() => setShow((s) => !s)}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name={show ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="rgba(255,255,255,0.55)"
                />
              </Pressable>
            }
          />
        )}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
          onPress={() => setRemember((r) => !r)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              borderWidth: 1.5,
              borderColor: remember ? C.primary : 'rgba(255,255,255,0.28)',
              backgroundColor: remember ? C.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {remember ? <Ionicons name="checkmark" size={14} color={C.white} /> : null}
          </View>
          <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            {t('auth.login.rememberMe')}
          </Text>
        </Pressable>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable accessibilityRole="link" hitSlop={6}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 13, color: C.accent }}>
              {t('auth.login.forgotPassword')}
            </Text>
          </Pressable>
        </Link>
      </View>

      <PrimaryButton label={t('auth.login.submit')} onPress={onSubmit} loading={login.isPending} />
    </View>
  );
}

// ── Login screen ────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { t } = useTranslation();
  const [method, setMethod] = useState<Method>('face');

  return (
    <AuthScreen>
      <Animated.View entering={FadeInDown.duration(500)}>
            <BrandMark />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(60)} style={{ marginTop: 30 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 33, color: C.white, letterSpacing: -0.6 }}>
              {t('auth.login.greetingTitle')}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontFamily: FONT.body,
                fontSize: 14.5,
                lineHeight: 21,
                color: 'rgba(255,255,255,0.6)',
                maxWidth: 280,
              }}
            >
              {t('auth.login.greetingSubtitle')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(120)} style={{ marginTop: 24 }}>
            <ModeToggle value={method} onChange={setMethod} />
          </Animated.View>

          <Animated.View
            key={method}
            entering={FadeInDown.duration(450).delay(120)}
            style={{ flex: 1, marginTop: 22, justifyContent: method === 'face' ? 'center' : 'flex-start' }}
          >
            {method === 'face' ? (
              <FaceAuth onNeedCredentials={() => setMethod('pwd')} />
            ) : (
              <CredForm />
            )}
          </Animated.View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              marginTop: 18,
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.42)" />
            <Text style={{ fontFamily: FONT.medium, fontSize: 11.5, color: 'rgba(255,255,255,0.42)' }}>
              {t('auth.login.secureFooter')}
            </Text>
          </View>
    </AuthScreen>
  );
}
