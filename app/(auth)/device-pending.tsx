import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { humanizeApiError } from '~/api/client';
import { feedback } from '~/components/feedback';
import {
  AuthScreen,
  C,
  FONT,
  GhostButton,
  PrimaryButton,
} from '~/components/login/auth-ui';
import { useAuth } from '~/hooks/useAuth';

export default function DevicePendingScreen() {
  const { t } = useTranslation();
  const { deviceStatus, deviceError, status, user, verifyDevice, logout } = useAuth();
  const [verifying, setVerifying] = useState(false);

  const isRevoked = deviceStatus === 'REVOKED';
  const isError = status === 'device_error';
  const tone = isRevoked ? C.danger : C.warning;

  const handleRecheck = async () => {
    setVerifying(true);
    try {
      const next = await verifyDevice();
      if (next === 'ACTIVE') {
        feedback.success(t('auth.device.approved'));
      } else if (next === null) {
        // Technical failure (network/server) — not a genuine pending device.
        feedback.error(t('auth.device.errorTitle'), t('auth.device.errorMessage'));
      } else {
        feedback.info(t('auth.device.stillPending'), t('auth.device.stillPendingMessage'));
      }
    } catch (error) {
      feedback.error(humanizeApiError(error));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AuthScreen>
      <Animated.View entering={FadeInDown.duration(500)} style={{ marginTop: 24, alignItems: 'center', gap: 18 }}>
        <View
          style={{
            width: 92,
            height: 92,
            borderRadius: 46,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${tone}22`,
            borderWidth: 1,
            borderColor: `${tone}55`,
          }}
        >
          <Ionicons
            name={isError ? 'warning' : isRevoked ? 'close-circle' : 'time'}
            size={46}
            color={tone}
          />
        </View>
        <Text
          style={{
            fontFamily: FONT.display,
            fontSize: 26,
            color: C.white,
            textAlign: 'center',
            letterSpacing: -0.4,
          }}
        >
          {isError
            ? t('auth.device.errorTitle')
            : isRevoked
              ? t('auth.device.revokedTitle')
              : t('auth.device.pendingTitle')}
        </Text>
        <Text
          style={{
            fontFamily: FONT.body,
            fontSize: 14.5,
            lineHeight: 22,
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            paddingHorizontal: 6,
          }}
        >
          {isError
            ? (deviceError ?? t('auth.device.errorMessage'))
            : isRevoked
              ? t('auth.device.revokedMessage')
              : t('auth.device.pendingMessage')}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(500).delay(80)}
        style={{
          marginTop: 28,
          borderRadius: 20,
          backgroundColor: C.glass,
          borderWidth: 1,
          borderColor: C.glassBorder,
          padding: 18,
          gap: 4,
        }}
      >
        <Text
          style={{
            fontFamily: FONT.bold,
            fontSize: 11,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: C.w50,
          }}
        >
          {t('auth.device.account')}
        </Text>
        <Text style={{ fontFamily: FONT.semibold, fontSize: 16, color: C.white }}>
          {user ? `${user.firstName} ${user.lastName}` : '—'}
        </Text>
        <Text style={{ fontFamily: FONT.medium, fontSize: 13.5, color: 'rgba(255,255,255,0.55)' }}>
          {user?.email ?? '—'}
        </Text>
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInDown.duration(500).delay(140)} style={{ gap: 12 }}>
        {!isRevoked ? (
          <PrimaryButton
            label={t('auth.device.recheck')}
            onPress={handleRecheck}
            loading={verifying}
            icon="refresh"
          />
        ) : null}
        <GhostButton label={t('common.logout')} onPress={() => void logout()} />
      </Animated.View>
    </AuthScreen>
  );
}
