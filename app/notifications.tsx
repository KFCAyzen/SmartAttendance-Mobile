import { Ionicons } from '@expo/vector-icons';
import { enUS, fr } from 'date-fns/locale';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { humanizeApiError } from '~/api/client';
import type { Notification } from '~/api/notifications';
import { feedback } from '~/components/feedback';
import { AllClear } from '~/components/notifications/AllClear';
import { CategoryFilter, type FilterKey } from '~/components/notifications/CategoryFilter';
import { NotificationRow } from '~/components/notifications/NotificationRow';
import { TriageCard } from '~/components/notifications/TriageCard';
import { useNotificationActions, useNotificationsList } from '~/hooks/useNotifications';
import { toNotificationView, type NotificationView } from '~/lib/notifications';

const GROUPS = ['today', 'week', 'earlier'] as const;

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const locale = i18n.language?.startsWith('en') ? enUS : fr;
  const query = useNotificationsList();
  const { read, readAll, remove } = useNotificationActions();
  const [filter, setFilter] = useState<FilterKey>('all');

  const items = useMemo<Notification[]>(() => {
    const out: Notification[] = [];
    for (const p of query.data?.pages ?? []) out.push(...p.data);
    return out;
  }, [query.data]);

  const views = useMemo(() => items.map((n) => toNotificationView(n, locale)), [items, locale]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: 0, pointage: 0, conges: 0, securite: 0 };
    for (const v of views) {
      if (v.pinned || v.unread) {
        c[v.category] += 1;
        c.all += 1;
      }
    }
    return c;
  }, [views]);

  const visible = filter === 'all' ? views : views.filter((v) => v.category === filter);
  const triage = visible.filter((v) => v.pinned);
  const feed = visible.filter((v) => !v.pinned);
  const unreadCount = views.filter((v) => !v.pinned && v.unread).length;

  const grouped = useMemo(
    () =>
      GROUPS.map((g) => ({ g, rows: feed.filter((n) => n.group === g) })).filter(
        (x) => x.rows.length > 0,
      ),
    [feed],
  );

  const filterLabels: Record<FilterKey, string> = {
    all: t('notifications.filters.all'),
    pointage: t('notifications.filters.pointage'),
    conges: t('notifications.filters.conges'),
    securite: t('notifications.filters.securite'),
  };

  const onRowPress = (n: NotificationView) => {
    if (n.unread) read.mutate(n.id);
  };
  const onLink = (n: NotificationView) => {
    if (!n.link) return;
    if (n.unread) read.mutate(n.id);
    router.push(n.link.route as never);
  };
  const onTriageAction = (n: NotificationView) => {
    read.mutate(n.id);
    if (n.actionRoute) router.push(n.actionRoute as never);
  };
  const onTriageIgnore = (n: NotificationView) => {
    remove.mutate(n.id, { onError: (e) => feedback.error(humanizeApiError(e)) });
  };
  const handleReadAll = async () => {
    try {
      await readAll.mutateAsync();
    } catch (e) {
      feedback.error(humanizeApiError(e));
    }
  };

  const showTriage = filter === 'all' || triage.length > 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-surface-light dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: false }} />

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2F5BFF" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 36, gap: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor="#2F5BFF"
              colors={['#2F5BFF']}
            />
          }
        >
          {/* Back + Header */}
          <View className="px-5">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              className="mb-3 h-[42px] w-[42px] items-center justify-center self-start rounded-[13px] border border-black/5 bg-surface-card dark:border-white/10 dark:bg-surface-cardDark"
            >
              <Ionicons name="chevron-back" size={22} color="#2F5BFF" />
            </Pressable>

            <View className="flex-row items-start justify-between gap-3">
              <View className="gap-1">
                <Text className="font-bodyBold text-[11px] uppercase tracking-[1.4px] text-primary">
                  {t('notifications.eyebrow')}
                </Text>
                <View className="flex-row items-center gap-[10px]">
                  <Text className="font-display text-[30px] leading-[32px] text-ink dark:text-white">
                    {t('notifications.title')}
                  </Text>
                  {unreadCount > 0 ? (
                    <View
                      className="h-6 min-w-[24px] items-center justify-center rounded-full px-2"
                      style={{
                        backgroundColor: '#FF8A3D',
                        shadowColor: '#FF8A3D',
                        shadowOpacity: 0.45,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 3,
                      }}
                    >
                      <Text className="font-display text-[13px] text-white">{unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={unreadCount === 0}
                onPress={() => void handleReadAll()}
                className="flex-row items-center gap-1.5 rounded-[14px] border border-black/5 bg-surface-card px-3 py-[10px] dark:border-white/10 dark:bg-surface-cardDark"
                style={{ opacity: unreadCount === 0 ? 0.6 : 1 }}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={16}
                  color={unreadCount === 0 ? '#9AA2B5' : '#2F5BFF'}
                />
                <Text
                  className={`font-bodyBold text-[12px] ${
                    unreadCount === 0 ? 'text-[#9AA2B5]' : 'text-primary'
                  }`}
                >
                  {t('notifications.markAllRead')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Filters */}
          <CategoryFilter value={filter} onChange={setFilter} counts={counts} labels={filterLabels} />

          {/* À traiter */}
          {showTriage ? (
            <View className="gap-3 px-5">
              <View className="flex-row items-center justify-between px-0.5">
                <Text className="font-bodyBold text-[11.5px] uppercase tracking-[1px] text-[#9AA2B5] dark:text-[#67718C]">
                  {t('notifications.triage')}
                </Text>
                {triage.length > 0 ? (
                  <View className="flex-row items-center gap-[5px]">
                    <Ionicons name="sparkles" size={13} color="#FF8A3D" />
                    <Text className="font-bodyBold text-[11px] text-accent">
                      {t('notifications.pending', { count: triage.length })}
                    </Text>
                  </View>
                ) : null}
              </View>
              {triage.length === 0 ? (
                <AllClear
                  title={t('notifications.allClearTitle')}
                  body={t('notifications.allClearBody')}
                />
              ) : (
                triage.map((n) => (
                  <TriageCard
                    key={n.id}
                    n={n}
                    actionLabel={n.actionKey ? t(`notifications.actions.${n.actionKey}`) : ''}
                    ignoreLabel={t('notifications.ignore')}
                    onAction={onTriageAction}
                    onIgnore={onTriageIgnore}
                  />
                ))
              )}
            </View>
          ) : null}

          {/* Timeline feed */}
          {grouped.map(({ g, rows }) => (
            <View key={g} className="gap-3.5 px-5">
              <Text className="px-0.5 font-bodyBold text-[11.5px] uppercase tracking-[1px] text-[#9AA2B5] dark:text-[#67718C]">
                {t(`notifications.groups.${g}`)}
              </Text>
              <View className="rounded-[28px] border border-black/5 bg-surface-card p-4 dark:border-white/10 dark:bg-surface-cardDark">
                {rows.map((n, i) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    last={i === rows.length - 1}
                    linkLabel={n.link ? t(`notifications.links.${n.link.labelKey}`) : undefined}
                    onPress={onRowPress}
                    onLink={onLink}
                  />
                ))}
              </View>
            </View>
          ))}

          {/* Empty state — sous-filtres uniquement ; « Tout » vide affiche déjà « Tout est à jour ». */}
          {filter !== 'all' && triage.length === 0 && feed.length === 0 ? (
            <View className="items-center px-5 py-[38px]">
              <Ionicons name="notifications-outline" size={30} color="#9AA2B5" />
              <Text className="mt-2.5 text-center font-body text-[13.5px] text-[#9AA2B5] dark:text-[#67718C]">
                {t('notifications.emptyCategory')}
              </Text>
            </View>
          ) : null}

          {/* Load more */}
          {query.hasNextPage ? (
            <View className="px-5">
              <Pressable
                accessibilityRole="button"
                onPress={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="items-center rounded-[18px] border border-black/5 bg-surface-card py-3.5 dark:border-white/10 dark:bg-surface-cardDark"
              >
                {query.isFetchingNextPage ? (
                  <ActivityIndicator color="#2F5BFF" />
                ) : (
                  <Text className="font-bodyBold text-[13.5px] text-primary">
                    {t('notifications.loadMore')}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
