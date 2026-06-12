import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthAura } from './AuthAura';

// Shared dark-auth design tokens. Inline styles (not NativeWind) keep the
// rgba/gradient/shadow fidelity the handoff calls for.
export const C = {
  primary: '#2F5BFF',
  accent: '#FF8A3D',
  success: '#16A34A',
  warning: '#FF8A3D',
  danger: '#EF4444',
  ink: '#0E1326',
  white: '#fff',
  w50: 'rgba(255,255,255,0.5)',
  w62: 'rgba(255,255,255,0.62)',
  w70: 'rgba(255,255,255,0.7)',
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.12)',
};

export const FONT = {
  display: 'BricolageGrotesque_700Bold',
  body: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

// ── Screen scaffold (aurora canvas + keyboard-safe scroll) ──────────────────
export function AuthScreen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: '#070A14' }}>
      <StatusBar style="light" />
      <AuthAura />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 28,
            paddingHorizontal: 26,
            paddingBottom: insets.bottom + 28,
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Circular glass back button ──────────────────────────────────────────────
export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.glass,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name="chevron-back" size={22} color={C.white} />
    </Pressable>
  );
}

// ── Brand lockup ────────────────────────────────────────────────────────────
export function BrandMark() {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <LinearGradient
        colors={[C.primary, '#6E5BFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 46,
          height: 46,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: C.primary,
          shadowOpacity: 0.45,
          shadowRadius: 13,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        <MaterialCommunityIcons name="line-scan" size={25} color={C.white} />
      </LinearGradient>
      <View style={{ gap: 1 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.white, letterSpacing: -0.2 }}>
          SmartAttendance
        </Text>
        <Text style={{ fontFamily: FONT.semibold, fontSize: 11.5, color: C.w50, letterSpacing: 0.2 }}>
          {t('auth.login.brandTagline')}
        </Text>
      </View>
    </View>
  );
}

// ── Floating-label glass field ──────────────────────────────────────────────
export function AuthField({
  icon,
  label,
  value,
  onChange,
  onBlur,
  secure,
  keyboardType,
  autoComplete,
  placeholder,
  trailing,
  error,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  secure?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoComplete?: 'email' | 'password';
  placeholder?: string;
  trailing?: React.ReactNode;
  error?: string;
}) {
  const [focus, setFocus] = useState(false);
  const float = focus || value.length > 0;
  const f = useSharedValue(float ? 1 : 0);
  useEffect(() => {
    f.value = withTiming(float ? 1 : 0, { duration: 180 });
  }, [float, f]);
  const labelStyle = useAnimatedStyle(() => ({
    top: interpolate(f.value, [0, 1], [19, 9]),
    fontSize: interpolate(f.value, [0, 1], [15, 11]),
  }));
  const borderColor = error ? C.danger : focus ? C.primary : C.glassBorder;
  const iconColor = focus ? C.primary : C.w50;

  return (
    <View>
      <View
        style={{
          height: 60,
          borderRadius: 20,
          backgroundColor: C.glass,
          borderWidth: 1.5,
          borderColor,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 14,
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
        <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
          <Animated.Text
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: 0,
                fontFamily: float ? FONT.bold : FONT.medium,
                letterSpacing: float ? 0.4 : 0,
                textTransform: float ? 'uppercase' : 'none',
                color: focus ? C.primary : C.w50,
              },
              labelStyle,
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            secureTextEntry={secure}
            keyboardType={keyboardType}
            autoComplete={autoComplete}
            autoCapitalize="none"
            placeholder={focus ? placeholder : undefined}
            placeholderTextColor="rgba(255,255,255,0.3)"
            onFocus={() => setFocus(true)}
            onBlur={() => {
              setFocus(false);
              onBlur?.();
            }}
            style={{
              color: C.white,
              fontFamily: FONT.semibold,
              fontSize: 15,
              height: '100%',
              paddingTop: 18,
              paddingBottom: 4,
            }}
          />
        </View>
        {trailing}
      </View>
      {error ? (
        <Text style={{ color: '#FCA5A5', fontSize: 12, marginTop: 4, marginLeft: 4, fontFamily: FONT.medium }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ── Primary CTA ─────────────────────────────────────────────────────────────
export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon = 'arrow-forward',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap | null;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 20,
        backgroundColor: C.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        shadowColor: C.primary,
        shadowOpacity: 0.45,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 14 },
        elevation: 8,
      })}
    >
      {loading ? (
        <ActivityIndicator color={C.white} />
      ) : (
        <>
          <Text style={{ fontFamily: FONT.bold, fontSize: 15.5, color: C.white }}>{label}</Text>
          {icon ? <Ionicons name={icon} size={20} color={C.white} /> : null}
        </>
      )}
    </Pressable>
  );
}

// ── Secondary (ghost) button ────────────────────────────────────────────────
export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.glass,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontFamily: FONT.bold, fontSize: 14.5, color: C.w70 }}>{label}</Text>
    </Pressable>
  );
}
