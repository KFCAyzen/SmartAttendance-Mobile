import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, Alert, Platform, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { humanizeApiError } from '~/api/client';
import { buildPhotoUrl } from '~/api/users';
import { Button } from '~/components/ui/Button';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { useAuth } from '~/hooks/useAuth';
import { useReferencePhoto } from '~/hooks/useReferencePhoto';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { photo, isLoading, upload, pickAndUpload, pickFromLibraryAndUpload } = useReferencePhoto();

  const mode: 'set' | 'request' = photo?.photoUrl ? 'request' : 'set';
  const photoUrl = buildPhotoUrl(photo?.photoUrl);
  const isPending = Boolean(photo?.photoChangeRequested);

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
        <Row label={t('profile.role')} value={user?.role ?? '—'} />
        <Row label={t('profile.department')} value={user?.department ?? '—'} />
      </View>

      <View className="rounded-3xl bg-white dark:bg-slate-900 p-6 gap-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('profile.referencePhoto')}
          </Text>
          {photo?.photoUrl ? (
            <View className={`rounded-full px-3 py-1 ${isPending ? 'bg-warning/10' : 'bg-success/10'}`}>
              <Text className={`text-xs font-semibold ${isPending ? 'text-warning' : 'text-success'}`}>
                {isPending ? t('profile.pending') : t('profile.validated')}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="items-center gap-3">
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: 140, height: 140, borderRadius: 70 }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="h-36 w-36 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
              <Ionicons name="person-outline" size={56} color="#94A3B8" />
            </View>
          )}
          <Text className="text-sm text-center text-slate-500 dark:text-slate-400 px-4">
            {photo?.photoUrl
              ? t('profile.photoUsed')
              : t('profile.photoMissing')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={showPicker}
          disabled={upload.isPending || isLoading}
          className={`h-12 rounded-2xl items-center justify-center flex-row gap-2 ${
            upload.isPending ? 'bg-primary/60' : 'bg-primary-50 dark:bg-primary-900/40'
          }`}
        >
          <Ionicons name="camera" size={18} color="#1E40AF" />
          <Text className="text-primary-800 dark:text-primary-100 font-semibold">
            {upload.isPending
              ? t('profile.uploading')
              : photo?.photoUrl
                ? t('profile.changePhoto')
                : t('profile.addPhoto')}
          </Text>
        </Pressable>
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
