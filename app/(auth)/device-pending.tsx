import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { humanizeApiError } from '~/api/client';
import { Button } from '~/components/ui/Button';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { useAuth } from '~/hooks/useAuth';

export default function DevicePendingScreen() {
  const { t } = useTranslation();
  const { deviceStatus, user, verifyDevice, logout } = useAuth();
  const [verifying, setVerifying] = useState(false);

  const isRevoked = deviceStatus === 'REVOKED';

  const handleRecheck = async () => {
    setVerifying(true);
    try {
      const next = await verifyDevice();
      if (next === 'ACTIVE') {
        Toast.show({ type: 'success', text1: t('auth.device.approved') });
      } else {
        Toast.show({
          type: 'info',
          text1: t('auth.device.stillPending'),
          text2: t('auth.device.stillPendingMessage'),
        });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: humanizeApiError(error) });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="mt-16 items-center gap-4">
        <View className="h-20 w-20 rounded-full bg-warning/10 items-center justify-center">
          <Ionicons
            name={isRevoked ? 'close-circle' : 'time'}
            size={48}
            color={isRevoked ? '#991B1B' : '#C2410C'}
          />
        </View>
        <Text className="text-2xl font-bold text-center text-slate-900 dark:text-white">
          {isRevoked ? t('auth.device.revokedTitle') : t('auth.device.pendingTitle')}
        </Text>
        <Text className="text-base text-center text-slate-500 dark:text-slate-400 px-4">
          {isRevoked ? t('auth.device.revokedMessage') : t('auth.device.pendingMessage')}
        </Text>
      </View>

      <View className="rounded-3xl bg-white dark:bg-slate-900 p-5 gap-2 shadow-sm">
        <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('auth.device.account')}
        </Text>
        <Text className="text-base font-semibold text-slate-900 dark:text-white">
          {user ? `${user.firstName} ${user.lastName}` : '—'}
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400">{user?.email ?? '—'}</Text>
      </View>

      <View className="gap-3">
        <Button
          label={t('auth.device.recheck')}
          loading={verifying}
          onPress={handleRecheck}
          disabled={isRevoked}
        />
        <Button variant="ghost" label={t('common.logout')} onPress={() => void logout()} />
      </View>
    </ScreenContainer>
  );
}
