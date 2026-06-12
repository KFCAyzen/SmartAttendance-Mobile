import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Notification } from '~/api/notifications';
import { useNotificationActions, useNotificationsList } from '~/hooks/useNotifications';
import { notificationVisual } from '~/lib/notifications';
import { useAuthStore } from '~/stores/auth.store';

/**
 * Feuille basse des notifications — comportement du prototype (app.jsx) : tap sur
 * la cloche ouvre un panneau, données réelles, lien « Voir tout » vers l'écran complet.
 */
export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const query = useNotificationsList();
  const { read } = useNotificationActions();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN' || s.user?.role === 'HR');
  const group = isAdmin ? '/(admin)' : '/(tabs)';
  const locale = i18n.language?.startsWith('en') ? enUS : fr;

  // Aperçu : on n'affiche que la première page chargée dans la feuille.
  const items = useMemo<Notification[]>(() => query.data?.pages?.[0]?.data ?? [], [query.data]);

  const handleTap = (n: Notification) => {
    if (!n.isRead) read.mutate(n.id);
    onClose();
    if (n.type.startsWith('LEAVE_')) router.push(`${group}/demandes` as never);
    else if (n.type === 'ATTENDANCE_REMINDER') router.push(`${group}/pointage` as never);
  };

  const seeAll = () => {
    onClose();
    router.push('/notifications');
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/45">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[80%] rounded-t-[26px] bg-surface-card pt-3 dark:bg-surface-cardDark"
        >
          <View className="mb-3.5 h-[5px] w-10 self-center rounded-full bg-black/10 dark:bg-white/15" />
          <View className="flex-row items-center justify-between px-5 pb-3">
            <Text className="font-display text-[21px] text-ink dark:text-white">
              {t('notifications.title')}
            </Text>
            <Pressable accessibilityRole="button" onPress={seeAll} className="px-2 py-1.5 active:opacity-70">
              <Text className="font-bodyBold text-[13px] text-primary">{t('notifications.seeAll')}</Text>
            </Pressable>
          </View>

          {query.isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#2F5BFF" />
            </View>
          ) : items.length === 0 ? (
            <View className="items-center gap-2 py-12">
              <Ionicons name="notifications-off-outline" size={34} color="#94A3B8" />
              <Text className="font-body text-[14px] text-muted dark:text-slate-400">
                {t('notifications.empty')}
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 20) + 10, gap: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {items.map((n) => {
                const visual = notificationVisual(n.type);
                const time = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale });
                return (
                  <Pressable
                    key={n.id}
                    accessibilityRole="button"
                    onPress={() => handleTap(n)}
                    className={`flex-row gap-3 rounded-2xl border border-black/5 p-3.5 active:opacity-80 dark:border-white/10 ${
                      n.isRead ? 'bg-surface-soft dark:bg-surface-softDark' : 'bg-primary/[0.06] dark:bg-primary/10'
                    }`}
                  >
                    <View className={`h-[38px] w-[38px] items-center justify-center rounded-[11px] ${visual.bg}`}>
                      <Ionicons name={visual.icon} size={19} color={visual.color} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row justify-between gap-2">
                        <Text numberOfLines={1} className="flex-1 font-bodyBold text-[14px] text-ink dark:text-white">
                          {n.title}
                        </Text>
                        <Text className="font-body text-[11px] text-muted dark:text-slate-500">{time}</Text>
                      </View>
                      <Text numberOfLines={2} className="mt-0.5 font-body text-[12.5px] leading-[18px] text-muted dark:text-slate-400">
                        {n.message}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
