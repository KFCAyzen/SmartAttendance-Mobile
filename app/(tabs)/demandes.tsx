import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

import { listAbsences, type Absence } from '~/api/absences';
import { getBalance, listLeaves, type Leave } from '~/api/leaves';
import { SegmentControl } from '~/components/ui/SegmentControl';
import {
  ABSENCE_STATUS_COLOR,
  ABSENCE_STATUS_LABELS,
  ABSENCE_TYPE_LABELS,
  canJustify,
} from '~/lib/absences';
import {
  LEAVE_STATUS_COLOR,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
} from '~/lib/leaves';

type Tab = 'leaves' | 'absences';

export default function DemandesScreen() {
  const [view, setView] = useState<Tab>('leaves');
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
      <View className="px-6 pt-6 pb-3 gap-3">
        <View className="gap-1">
          <Text className="text-xs uppercase tracking-widest text-primary-700 dark:text-primary-100">
            SmartAttendance
          </Text>
          <Text className="text-3xl font-bold text-slate-900 dark:text-white">Demandes</Text>
        </View>
        <SegmentControl
          value={view}
          onChange={setView}
          options={[
            { value: 'leaves', label: 'Congés' },
            { value: 'absences', label: 'Absences' },
          ]}
        />
      </View>

      {view === 'leaves' ? <LeavesList /> : <AbsencesList />}

      {view === 'leaves' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/leave-new')}
          className="absolute bottom-8 right-6 h-14 w-14 rounded-full bg-primary items-center justify-center shadow-lg"
        >
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

function LeavesList() {
  const query = useInfiniteQuery({
    queryKey: ['leaves'],
    queryFn: ({ pageParam = 1 }) => listLeaves(pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      if (!last.meta) return undefined;
      const next = last.meta.page + 1;
      return next <= last.meta.totalPages ? next : undefined;
    },
  });

  const balance = useQuery({ queryKey: ['leaves', 'balance'], queryFn: getBalance });

  const items = useMemo<Leave[]>(() => {
    const out: Leave[] = [];
    for (const p of query.data?.pages ?? []) out.push(...(p.data ?? p.items ?? []));
    return out;
  }, [query.data]);

  if (query.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, gap: 8 }}
      ListHeaderComponent={
        balance.data && balance.data.length > 0 ? (
          <View className="mb-2 rounded-3xl bg-white dark:bg-slate-900 p-4 shadow-sm">
            <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Soldes
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {balance.data.slice(0, 4).map((b) => (
                <View key={b.type} className="min-w-[45%] flex-1">
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {LEAVE_TYPE_LABELS[b.type]}
                  </Text>
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    {b.remaining}
                    <Text className="text-xs font-normal text-slate-500"> / {b.total} j</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null
      }
      renderItem={({ item }) => <LeaveCard leave={item} />}
      ListEmptyComponent={
        <View className="items-center py-16 gap-2">
          <Ionicons name="calendar-outline" size={36} color="#94A3B8" />
          <Text className="text-base text-slate-500 dark:text-slate-400">
            Aucune demande de congé.
          </Text>
        </View>
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
  );
}

function LeaveCard({ leave }: { leave: Leave }) {
  const color = LEAVE_STATUS_COLOR[leave.status];
  return (
    <View className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            {LEAVE_TYPE_LABELS[leave.type]}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {format(new Date(leave.startDate), 'd MMM yyyy', { locale: fr })} —{' '}
            {format(new Date(leave.endDate), 'd MMM yyyy', { locale: fr })}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${color.bg}`}>
          <Text className={`text-xs font-semibold ${color.text}`}>
            {LEAVE_STATUS_LABELS[leave.status]}
          </Text>
        </View>
      </View>
      {leave.reason ? (
        <Text className="mt-2 text-sm text-slate-600 dark:text-slate-300">{leave.reason}</Text>
      ) : null}
      {leave.rejectionReason ? (
        <Text className="mt-2 text-xs text-danger">Motif: {leave.rejectionReason}</Text>
      ) : null}
    </View>
  );
}

function AbsencesList() {
  const router = useRouter();
  const query = useInfiniteQuery({
    queryKey: ['absences'],
    queryFn: ({ pageParam = 1 }) => listAbsences({ page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      if (!last.meta) return undefined;
      const next = last.meta.page + 1;
      return next <= last.meta.totalPages ? next : undefined;
    },
  });

  const items = useMemo<Absence[]>(() => {
    const out: Absence[] = [];
    for (const p of query.data?.pages ?? [])
      out.push(...(p.data ?? p.items ?? p.absences ?? []));
    return out;
  }, [query.data]);

  if (query.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 8 }}
      renderItem={({ item }) => (
        <AbsenceCard absence={item} onJustify={() => router.push(`/justify-absence?id=${item.id}`)} />
      )}
      ListEmptyComponent={
        <View className="items-center py-16 gap-2">
          <Ionicons name="checkmark-circle-outline" size={36} color="#2F855A" />
          <Text className="text-base text-slate-500 dark:text-slate-400">
            Aucune absence enregistrée.
          </Text>
        </View>
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
  );
}

function AbsenceCard({ absence, onJustify }: { absence: Absence; onJustify: () => void }) {
  const color = ABSENCE_STATUS_COLOR[absence.status];
  return (
    <View className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm gap-2">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            {ABSENCE_TYPE_LABELS[absence.type]}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {format(new Date(absence.date), 'EEEE d MMMM yyyy', { locale: fr })}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${color.bg}`}>
          <Text className={`text-xs font-semibold ${color.text}`}>
            {ABSENCE_STATUS_LABELS[absence.status]}
          </Text>
        </View>
      </View>
      {absence.reason ? (
        <Text className="text-sm text-slate-600 dark:text-slate-300">{absence.reason}</Text>
      ) : null}
      {canJustify(absence.status) ? (
        <Pressable
          accessibilityRole="button"
          onPress={onJustify}
          className="self-start flex-row items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/40 px-4 py-2"
        >
          <Ionicons name="document-attach" size={14} color="#1E40AF" />
          <Text className="text-sm font-semibold text-primary-800 dark:text-primary-100">
            Justifier
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
