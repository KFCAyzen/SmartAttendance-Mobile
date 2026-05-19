import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { useAuth } from '~/hooks/useAuth';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const firstName = user?.firstName ?? '';

  return (
    <ScreenContainer>
      <View className="gap-1 mt-2">
        <Text className="text-xs uppercase tracking-widest text-primary-700 dark:text-primary-100">
          {t('common.appName')}
        </Text>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">
          {firstName ? `Bonjour, ${firstName}` : 'Bonjour'}
        </Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          Prêt à pointer ? Lancez la reconnaissance faciale en un tap.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/pointage')}
        className="rounded-3xl bg-primary p-6 gap-4 active:bg-primary-700"
      >
        <View className="flex-row items-center justify-between">
          <View className="h-14 w-14 rounded-full bg-white/20 items-center justify-center">
            <Ionicons name="scan-circle" size={36} color="white" />
          </View>
          <Ionicons name="chevron-forward" size={28} color="white" />
        </View>
        <View>
          <Text className="text-white text-2xl font-bold">{t('checkin.title')}</Text>
          <Text className="text-primary-100 text-sm mt-1">
            Visage reconnu = pointage instantané.
          </Text>
        </View>
      </Pressable>

      <View className="rounded-3xl bg-white dark:bg-slate-900 p-5 gap-3 shadow-sm">
        <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Aide
        </Text>
        <View className="flex-row items-start gap-3">
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text className="flex-1 text-sm text-slate-700 dark:text-slate-300">
            Avant votre premier pointage, vérifiez qu&apos;une photo de référence a bien été
            téléchargée depuis votre profil.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
