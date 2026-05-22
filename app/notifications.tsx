import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { humanizeApiError } from '~/api/client';
import type { Notification } from '~/api/notifications';
import { useNotificationActions, useNotificationsList } from '~/hooks/useNotifications';
import { notificationVisual } from '~/lib/notifications';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useNotificationsList();
  const { read, readAll } = useNotificationActions();

  const items = useMemo<Notification[]>(() => {
    const out: Notification[] = [];
    for (const p of query.data?.pages ?? []) out.push(...p.data);
    return out;
  }, [query.data]);

  const hasUnread = items.some((n) => !n.isRead);

  const handleTap = (n: Notification) => {
    if (!n.isRead) read.mutate(n.id);
    if (n.type.startsWith('LEAVE_')) router.push('/(tabs)/demandes');
    else if (n.type === 'ATTENDANCE_REMINDER') router.push('/(tabs)/pointage');
  };

  const handleReadAll = async () => {
    try {
      await readAll.mutateAsync();
    } catch (e) {
      Toast.show({ type: 'error', text1: humanizeApiError(e) });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('notifications.title'),
          headerRight: () =>
            hasUnread ? (
              <Pressable onPress={() => void handleReadAll()} className="px-3 py-2">
                <Text className="text-sm font-semibold text-primary-700 dark:text-primary-100">
                  {t('notifications.markAllRead')}
                </Text>
              </Pressable>
            ) : null,
        }}
      />

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 8 }}
          renderItem={({ item }) => <NotificationRow notification={item} onPress={() => handleTap(item)} />}
          ListEmptyComponent={
            <View className="items-center py-20 gap-2">
              <Ionicons name="notifications-off-outline" size={36} color="#94A3B8" />
              <Text className="text-base text-slate-500 dark:text-slate-400">
                {t('notifications.empty')}
              </Text>
            </View>
          }
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#3B82F6" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor="#3B82F6"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const visual = notificationVisual(notification.type);
  const time = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr });

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`rounded-2xl p-4 flex-row gap-3 ${
        notification.isRead
          ? 'bg-white dark:bg-slate-900'
          : 'bg-primary-50 dark:bg-primary-900/30'
      } shadow-sm`}
    >
      <View className={`h-10 w-10 rounded-full items-center justify-center ${visual.bg}`}>
        <Ionicons name={visual.icon} size={20} color={visual.color} />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            numberOfLines={1}
            className={`flex-1 text-base ${
              notification.isRead
                ? 'font-medium text-slate-700 dark:text-slate-200'
                : 'font-semibold text-slate-900 dark:text-white'
            }`}
          >
            {notification.title}
          </Text>
          {!notification.isRead ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
        </View>
        <Text
          numberOfLines={2}
          className="text-sm text-slate-600 dark:text-slate-300"
        >
          {notification.message}
        </Text>
        <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">{time}</Text>
      </View>
    </Pressable>
  );
}
