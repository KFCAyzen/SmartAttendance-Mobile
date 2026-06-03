import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, Alert, Platform, Pressable, Switch, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { humanizeApiError } from '~/api/client';
import { buildPhotoUrl } from '~/api/users';
import { Card } from '~/components/ui/Card';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { StatusPill } from '~/components/ui/StatusPill';
import { useAuth } from '~/hooks/useAuth';
import { useReferencePhoto } from '~/hooks/useReferencePhoto';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { photo, isLoading, upload, pickAndUpload, pickFromLibraryAndUpload } = useReferencePhoto();

  const mode: 'set' | 'request' = photo?.photoUrl ? 'request' : 'set';
  const photoUrl = buildPhotoUrl(photo?.photoUrl);
  const isPending = Boolean(photo?.photoChangeRequested);
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((p) => (p as string).charAt(0).toUpperCase())
    .join('');

  const run = async (action: () => Promise<unknown>) => {
    try {
      const result = await action();
      if (!result) return; // user cancelled
      Toast.show({
        type: 'success',
        text1: t('profile.photoSaved'),
        text2:
          mode === 'request' && !(result as { autoApproved?: boolean }).autoApproved
            ? t('profile.photoPending')
            : t('profile.photoReady'),
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: humanizeApiError(error) });
    }
  };

  const showPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('common.cancel'), t('justifyAbsence.cameraSource'), t('profile.gallery')],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) void run(() => pickAndUpload(mode));
          if (i === 2) void run(() => pickFromLibraryAndUpload(mode));
        },
      );
    } else {
      Alert.alert(t('profile.referencePhoto'), t('profile.chooseSource'), [
        { text: t('profile.camera'), onPress: () => void run(() => pickAndUpload(mode)) },
        { text: t('profile.gallery'), onPress: () => void run(() => pickFromLibraryAndUpload(mode)) },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  };

  const confirmLogout = () => {
    Alert.alert(t('common.logout'), t('profile.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <ScreenContainer>
      <View className="gap-[3px] pt-1">
        <Text className="font-bodyBold text-[11px] uppercase tracking-[1.4px] text-primary">
          {t('common.appName')}
        </Text>
        <Text className="font-display text-[30px] leading-none text-ink dark:text-white">
          {t('tabs.profile')}
        </Text>
      </View>

      {/* Identité */}
      <Card className="flex-row items-center gap-[15px]">
        <LinearGradient
          colors={['#2F5BFF', '#FF8A3D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 60,
            width: 60,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
          }}
        >
          <Text className="font-display text-[22px] text-white">{initials || '–'}</Text>
        </LinearGradient>
        <View className="flex-1">
          <Text className="font-display text-[19px] text-ink dark:text-white">
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </Text>
          <Text className="font-body text-[13px] text-muted dark:text-slate-400">
            {user?.email ?? '—'}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {user?.role ? <StatusPill tone="primary">{user.role}</StatusPill> : null}
            {user?.department ? <StatusPill tone="neutral">{user.department}</StatusPill> : null}
          </View>
        </View>
      </Card>

      {/* Photo de référence */}
      <Card className="gap-3.5">
        <View className="flex-row items-center justify-between">
          <Text className="font-bodyBold text-[12px] uppercase tracking-wide text-muted dark:text-slate-400">
            {t('profile.referencePhoto')}
          </Text>
          {photo?.photoUrl ? (
            <StatusPill tone={isPending ? 'warning' : 'success'}>
              {isPending ? t('profile.pending') : t('profile.validated')}
            </StatusPill>
          ) : null}
        </View>

        <View className="flex-row items-center gap-[15px]">
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: 78, height: 78, borderRadius: 34 }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="h-[78px] w-[78px] items-center justify-center rounded-[34px] bg-surface-soft dark:bg-surface-softDark">
              <Ionicons name="person-outline" size={36} color="#9AA5BE" />
            </View>
          )}
          <View className="flex-1 gap-2.5">
            <Text className="font-body text-[12.5px] leading-5 text-muted dark:text-slate-400">
              {photo?.photoUrl ? t('profile.photoUsed') : t('profile.photoMissing')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={showPicker}
              disabled={upload.isPending || isLoading}
              className={`flex-row items-center gap-1.5 self-start rounded-full bg-primary/10 px-4 py-2 active:opacity-80 ${
                upload.isPending ? 'opacity-60' : ''
              }`}
            >
              <Ionicons name="camera-outline" size={15} color="#2F5BFF" />
              <Text className="font-bodyBold text-[12.5px] text-primary">
                {upload.isPending
                  ? t('profile.uploading')
                  : photo?.photoUrl
                    ? t('profile.changePhoto')
                    : t('profile.addPhoto')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Card>

      {/* Réglages */}
      <Card pad={0} className="overflow-hidden">
        <SettingRow icon="globe-outline" label={t('profile.language')} detail={t('profile.languageValue')} />
        <SettingRow icon="notifications-outline" label={t('profile.notifications')} detail={t('profile.notificationsOn')} />
        <SettingRow
          icon="moon-outline"
          label={t('profile.darkMode')}
          control={
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={() => toggleColorScheme()}
              trackColor={{ false: '#D6DAE6', true: '#2F5BFF' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D6DAE6"
            />
          }
        />
        <SettingRow
          icon="shield-checkmark-outline"
          label={t('profile.security')}
          detail={t('profile.thisDevice')}
          last
        />
      </Card>

      {/* Déconnexion */}
      <Pressable
        accessibilityRole="button"
        onPress={confirmLogout}
        className="flex-row items-center justify-center gap-2 rounded-[20px] border border-danger/30 bg-danger/[0.08] py-[15px] active:opacity-80"
      >
        <Ionicons name="log-out-outline" size={19} color="#EF4444" />
        <Text className="font-bodyBold text-[14.5px] text-danger">{t('common.logout')}</Text>
      </Pressable>

      <Text className="text-center font-body text-[11.5px] text-muted dark:text-slate-500">
        SmartAttendance · v2.0
      </Text>
    </ScreenContainer>
  );
}

function SettingRow({
  icon,
  label,
  detail,
  control,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  control?: ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-[14px] ${
        last ? '' : 'border-b border-black/5 dark:border-white/10'
      }`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-[11px] bg-primary/10">
        <Ionicons name={icon} size={18} color="#2F5BFF" />
      </View>
      <Text className="flex-1 font-bodySemibold text-[14.5px] text-ink dark:text-white">
        {label}
      </Text>
      {control ?? (
        <View className="flex-row items-center gap-1.5">
          {detail ? (
            <Text className="font-body text-[13.5px] text-muted dark:text-slate-400">{detail}</Text>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color="#9AA5BE" />
        </View>
      )}
    </View>
  );
}
