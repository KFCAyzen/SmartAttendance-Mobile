import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { Button } from '~/components/ui/Button';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { useAuth } from '~/hooks/useAuth';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert(
      t('common.logout'),
      'Vous serez déconnecté de votre compte sur cet appareil.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.logout'), style: 'destructive', onPress: () => void logout() },
      ],
    );
  };

  return (
    <ScreenContainer>
      <View className="gap-2 mt-2">
        <Text className="text-xs uppercase tracking-widest text-primary-700 dark:text-primary-100">
          {t('common.appName')}
        </Text>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('tabs.profile')}
        </Text>
      </View>

      <View className="rounded-3xl bg-white dark:bg-slate-900 p-6 gap-4 shadow-sm">
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 rounded-full bg-primary items-center justify-center">
            <Ionicons name="person" size={32} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">{user?.email ?? '—'}</Text>
          </View>
        </View>
        <View className="h-px bg-slate-200 dark:bg-slate-800" />
        <Row label="Rôle" value={user?.role ?? '—'} />
        <Row label="Département" value={user?.department ?? '—'} />
      </View>

      <Button variant="danger" label={t('common.logout')} onPress={confirmLogout} />
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className="text-sm font-medium text-slate-900 dark:text-white">{value}</Text>
    </View>
  );
}
