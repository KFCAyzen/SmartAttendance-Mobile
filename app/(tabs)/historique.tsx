import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { format, startOfWeek } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHistory, getWeeklyStats, type AttendanceHistoryItem } from '~/api/attendance';
import { Card } from '~/components/ui/Card';
import { StatusPill } from '~/components/ui/StatusPill';
import { WeekBars } from '~/components/ui/WeekBars';
import { dayKey, formatDayLabel, formatTime, splitHoursMinutes } from '~/lib/date';

const PAGE_SIZE = 20;

const DAY_LABELS: Record<'fr' | 'en', string[]> = {
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};
const todayWeekIndex = (new Date().getDay() + 6) % 7;

type Row =
  | { kind: 'header'; label: string; key: string }
  | { kind: 'item'; data: AttendanceHistoryItem };

export default function HistoriqueScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? enUS : fr;

  const query = useInfiniteQuery({
    queryKey: ['attendance', 'history'],
    queryFn: ({ pageParam = 1 }) => getHistory(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const next = last.meta.page + 1;
      return next <= last.meta.totalPages ? next : undefined;
    },
  });

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let currentKey: string | null = null;
    for (const page of query.data?.pages ?? []) {
      const items = page.data ?? page.attendances ?? [];
      for (const item of items) {
        const key = dayKey(item.timestamp);
        if (key !== currentKey) {
          currentKey = key;
          out.push({
            kind: 'header',
            label: formatDayLabel(item.timestamp, {
              locale,
              today: t('history.today'),
              yesterday: t('history.yesterday'),
            }),
            key,
          });
        }
        out.push({ kind: 'item', data: item });
      }
    }
    return out;
  }, [query.data, locale, t]);

  const weekLabel = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'd MMMM', {
    locale,
  }).toUpperCase();

  // Stats hebdo réelles (graphe, total, cible, ponctualité).
  const weekly = useQuery({ queryKey: ['attendance', 'weekly'], queryFn: getWeeklyStats });
  const localeKey = i18n.language?.startsWith('en') ? 'en' : 'fr';
  const weekBars = (weekly.data?.days ?? []).map((d) => ({
    label: DAY_LABELS[localeKey][d.weekday - 1] ?? '',
    v: d.hours,
  }));
  const bars = weekBars.length ? weekBars : DAY_LABELS[localeKey].map((label) => ({ label, v: 0 }));
  const total = splitHoursMinutes(weekly.data?.totalHours ?? 0);
  const targetH = Math.round(weekly.data?.targetHours ?? 40);
  const onTimePct = weekly.data?.onTimePct ?? null;

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-light dark:bg-surface-dark">
        <ActivityIndicator color="#2F5BFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-surface-light dark:bg-surface-dark"
    >
      <View className="gap-[3px] px-5 pb-1 pt-4">
        <Text className="font-bodyBold text-[11px] uppercase tracking-[1.4px] text-primary">
          {t('common.appName')}
        </Text>
        <Text className="font-display text-[30px] leading-none text-ink dark:text-white">
          {t('tabs.history')}
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => (row.kind === 'header' ? `h-${row.key}` : `i-${row.data.id}`)}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <SectionHeader label={item.label} />
          ) : (
            <HistoryRow item={item.data} />
          )
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        ListHeaderComponent={
          <Card className="mb-3 gap-3.5">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="font-bodyBold text-[12px] tracking-wide text-muted dark:text-slate-400">
                  {t('history.weekOf', { date: weekLabel })}
                </Text>
                <Text className="mt-0.5 font-display text-[28px] text-ink dark:text-white">
                  {`${total.h}h ${String(total.m).padStart(2, '0')}`}
                  <Text className="font-bodySemibold text-[15px] text-muted dark:text-slate-400">
                    {` / ${targetH}h`}
                  </Text>
                </Text>
              </View>
              {onTimePct != null ? (
                <StatusPill tone="success">{t('home.onTime', { pct: onTimePct })}</StatusPill>
              ) : null}
            </View>
            <WeekBars data={bars} accentIndex={todayWeekIndex} height={70} />
          </Card>
        }
        ListEmptyComponent={
          <View className="items-center justify-center gap-2 py-16">
            <Ionicons name="time-outline" size={36} color="#9AA5BE" />
            <Text className="font-body text-[15px] text-muted dark:text-slate-400">
              {t('history.empty')}
            </Text>
          </View>
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#2F5BFF" />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            tintColor="#2F5BFF"
          />
        }
      />
    </SafeAreaView>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="mb-1 mt-3 font-bodyBold text-[12px] uppercase tracking-wide text-muted dark:text-slate-500">
      {label}
    </Text>
  );
}

function HistoryRow({ item }: { item: AttendanceHistoryItem }) {
  const { t } = useTranslation();
  const isIn = item.type === 'CHECK_IN';
  const pct =
    typeof item.faceConfidence === 'number'
      ? Math.round((item.faceConfidence <= 1 ? item.faceConfidence * 100 : item.faceConfidence))
      : null;
  return (
    <Card pad={14} radius={20} className="flex-row items-center gap-3">
      <View
        className={`h-[42px] w-[42px] items-center justify-center rounded-[13px] ${
          isIn ? 'bg-success/15' : 'bg-accent/15'
        }`}
      >
        <Ionicons
          name={isIn ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={isIn ? '#16A34A' : '#FF8A3D'}
        />
      </View>
      <View className="flex-1">
        <Text className="font-bodyBold text-[15px] text-ink dark:text-white">
          {isIn ? t('history.checkIn') : t('history.checkOut')}
        </Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="location-outline" size={12} color="#717A90" />
          <Text className="font-body text-[12px] text-muted dark:text-slate-400">
            {item.location?.name ??
              (item.latitude && item.longitude ? t('history.gps') : t('history.unknownSite'))}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="font-display text-[17px] text-ink dark:text-white">
          {formatTime(item.timestamp)}
        </Text>
        {item.faceMatch || pct != null ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="scan" size={10} color="#2F5BFF" />
            <Text className="font-bodyBold text-[10.5px] text-primary">
              {pct != null ? `${pct}%` : t('history.recognized')}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
