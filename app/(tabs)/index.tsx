import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

import { useAuthStore } from '~/stores/auth.store';

export default function HomeScreen() {
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
      <ScrollView contentContainerClassName="px-6 py-8 gap-6">
        <View className="gap-2">
          <Text className="text-xs uppercase tracking-widest text-primary-700 dark:text-primary-100">
            {t('common.appName')}
          </Text>
          <Text className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('tabs.home')}
          </Text>
        </View>

        <View className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm">
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            Statut de session : <Text className="font-semibold">{status}</Text>
          </Text>
          <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Utilisateur : <Text className="font-semibold">{user?.email ?? '—'}</Text>
          </Text>
        </View>

        <View className="rounded-3xl bg-primary p-6">
          <Text className="text-lg font-semibold text-white">
            Bienvenue dans SmartAttendance Mobile
          </Text>
          <Text className="mt-2 text-sm text-primary-100">
            Bootstrap terminé. Étape suivante : flow d&apos;authentification + pointage facial.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
