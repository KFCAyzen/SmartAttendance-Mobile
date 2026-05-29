import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { getHistory, type AttendanceHistoryItem } from '~/api/attendance';
import { dayKey, formatDayLabel, formatTime } from '~/lib/date';

const PAGE_SIZE = 20;

type Row =
  | { kind: 'header'; label: string; key: string }
  | { kind: 'item'; data: AttendanceHistoryItem };

export default function HistoriqueScreen() {
  const { t } = useTranslation();

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
          out.push({ kind: 'header', label: formatDayLabel(item.timestamp), key });
        }
        out.push({ kind: 'item', data: item });
      }
    }
    return out;
  }, [query.data]);

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark items-center justify-center">
        <ActivityIndicator color="#3B82F6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
      <View className="px-6 pt-6 pb-2 gap-1">
        <Text className="text-xs uppercase tracking-widest text-primary-700 dark:text-primary-100">
          {t('common.appName')}
        </Text>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('tabs.history')}
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) =>
          row.kind === 'header' ? `h-${row.key}` : `i-${row.data.id}`
        }
        renderItem={({ item }) =>
          item.kind === 'header' ? <SectionHeader label={item.label} /> : <Row item={item.data} />
        }
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <View className="items-center justify-center py-16 gap-2">
            <Ionicons name="time-outline" size={36} color="#94A3B8" />
            <Text className="text-base text-slate-500 dark:text-slate-400">
              {t('history.empty')}
            </Text>
          </View>
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator color="#3B82F6" />
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
            tintColor="#3B82F6"
          />
        }
      />
    </SafeAreaView>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-4 mb-1">
      {label}
    </Text>
  );
}

function Row({ item }: { item: AttendanceHistoryItem }) {
  const { t } = useTranslation();
  const isIn = item.type === 'CHECK_IN';
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm">
      <View
        className={`h-10 w-10 rounded-full items-center justify-center ${
          isIn ? 'bg-success/15' : 'bg-accent/15'
        }`}
      >
        <Ionicons
          name={isIn ? 'arrow-down' : 'arrow-up'}
          size={18}
          color={isIn ? '#2F855A' : '#D88932'}
        />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-slate-900 dark:text-white">
          {isIn ? t('history.checkIn') : t('history.checkOut')}
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          {item.location?.name ??
            (item.latitude && item.longitude ? t('history.gps') : t('history.unknownSite'))}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-base font-semibold text-slate-900 dark:text-white">
          {formatTime(item.timestamp)}
        </Text>
        {item.faceMatch ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="scan" size={10} color="#3B82F6" />
            <Text className="text-[10px] font-medium text-primary-700 dark:text-primary-100">
              {t('history.recognized')}
              {typeof item.faceConfidence === 'number'
                ? ` ${Math.round((item.faceConfidence ?? 0) * 100)}%`
                : ''}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
