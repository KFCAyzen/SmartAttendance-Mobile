import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Share, Switch, Text, View } from 'react-native';

import { humanizeApiError } from '~/api/client';
import { buildPhotoUrl, exportMyData } from '~/api/users';
import { feedback } from '~/components/feedback';
import { Card } from '~/components/ui/Card';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { StatusPill } from '~/components/ui/StatusPill';
import { useAuth } from '~/hooks/useAuth';
import { useIsAdmin } from '~/hooks/useAdminData';
import { useUnreadCount } from '~/hooks/useNotifications';
import { useReferencePhoto } from '~/hooks/useReferencePhoto';
import { setLanguage } from '~/i18n';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const isAdmin = useIsAdmin();
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { photo, isLoading, upload, pickAndUpload } = useReferencePhoto();
  const { count: unreadCount } = useUnreadCount();

  const isEnglish = i18n.language?.startsWith('en');
  const toggleLanguage = () => void setLanguage(isEnglish ? 'fr' : 'en');

  const mode: 'set' | 'request' = photo?.photoUrl ? 'request' : 'set';
  const photoUrl = buildPhotoUrl(photo?.photoUrl);
  const isPending = Boolean(photo?.photoChangeRequested);
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((p) => (p as string).charAt(0).toUpperCase())
    .join('');
  const adminRoute = segments[0] === '(admin)' ? '/(admin)' : '/(tabs)/admin';

  const run = async (action: () => Promise<unknown>) => {
    try {
      const result = await action();
      if (!result) return; // user cancelled
      feedback.success(
        t('profile.photoSaved'),
        mode === 'request' && !(result as { autoApproved?: boolean }).autoApproved
          ? t('profile.photoPending')
          : t('profile.photoReady'),
      );
    } catch (error) {
      feedback.error(humanizeApiError(error));
    }
  };

  // La photo de référence doit être prise en direct (anti-usurpation) : on ouvre
  // la caméra frontale, jamais la galerie/fichiers.
  const capturePhoto = () => void run(() => pickAndUpload(mode));

  const confirmLogout = () => {
    Alert.alert(t('common.logout'), t('profile.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const [exporting, setExporting] = useState(false);
  // RGPD : l'utilisateur récupère ses données personnelles (droit d'accès/portabilité).
  const exportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportMyData(isEnglish ? 'en' : 'fr');
      await Share.share({
        title: t('profile.exportData'),
        message: JSON.stringify(data, null, 2),
      });
    } catch (error) {
      feedback.error(humanizeApiError(error));
    } finally {
      setExporting(false);
    }
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
          colors={['#2F5BFF', '#8D70A8']}
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
              onPress={capturePhoto}
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
        {isAdmin ? (
          <SettingRow
            icon="grid-outline"
            label={t('tabs.admin')}
            onPress={() => router.push(adminRoute as never)}
          />
        ) : null}
        <SettingRow
          icon="globe-outline"
          label={t('profile.language')}
          detail={isEnglish ? 'English' : 'Français'}
          onPress={toggleLanguage}
        />
        <SettingRow
          icon="notifications-outline"
          label={t('profile.notifications')}
          detail={unreadCount > 0 ? String(unreadCount) : undefined}
          onPress={() => router.push('/notifications')}
        />
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
          onPress={() => router.push('/change-password')}
        />
        <SettingRow
          icon="download-outline"
          label={t('profile.exportData')}
          onPress={exportData}
          control={exporting ? <ActivityIndicator size="small" color="#2F5BFF" /> : undefined}
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
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  control?: ReactNode;
  last?: boolean;
  onPress?: () => void;
}) {
  const inner = (
    <>
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
    </>
  );
  const base = `flex-row items-center gap-3 px-4 py-[14px] ${
    last ? '' : 'border-b border-black/5 dark:border-white/10'
  }`;
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className={`${base} active:bg-black/5 dark:active:bg-white/5`}
      >
        {inner}
      </Pressable>
    );
  }
  return <View className={base}>{inner}</View>;
}
