import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listAbsences, type Absence, type AbsenceStatus } from '~/api/absences';
import { getBalance, listLeaves, type Leave, type LeaveStatus, type LeaveType } from '~/api/leaves';
import { Card } from '~/components/ui/Card';
import { ProgressBar } from '~/components/ui/ProgressBar';
import { SegmentControl } from '~/components/ui/SegmentControl';
import { StatusPill, type PillTone } from '~/components/ui/StatusPill';
import { canJustify, getAbsenceStatusLabel, getAbsenceTypeLabel } from '~/lib/absences';
import { getLeaveStatusLabel, getLeaveTypeLabel } from '~/lib/leaves';

type Tab = 'leaves' | 'absences';

const LEAVE_STATUS_TONE: Record<LeaveStatus, PillTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  INTERRUPTED: 'neutral',
};

const ABSENCE_STATUS_TONE: Record<AbsenceStatus, PillTone> = {
  PENDING: 'warning',
  JUSTIFIED: 'success',
  EXCUSED: 'success',
  UNJUSTIFIED: 'danger',
};

const LEAVE_TYPE_TONE: Record<LeaveType, 'primary' | 'accent' | 'success' | 'warning'> = {
  VACATION: 'primary',
  SICK: 'success',
  PERSONAL: 'warning',
  MATERNITY: 'primary',
  PATERNITY: 'primary',
  UNPAID: 'accent',
};

export default function DemandesScreen() {
  const { t } = useTranslation();
  const [view, setView] = useState<Tab>('leaves');
  const router = useRouter();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-surface-light dark:bg-surface-dark"
    >
      <View className="gap-3 px-5 pb-3 pt-2">
        <View className="gap-[3px]">
          <Text className="font-bodyBold text-[11px] uppercase tracking-[1.4px] text-primary">
            {t('common.appName')}
          </Text>
          <Text className="font-display text-[30px] leading-none text-ink dark:text-white">
            {t('requests.title')}
          </Text>
        </View>
        <SegmentControl
          value={view}
          onChange={setView}
          options={[
            { value: 'leaves', label: t('requests.leaves') },
            { value: 'absences', label: t('requests.absences') },
          ]}
        />
      </View>

      {view === 'leaves' ? <LeavesList /> : <AbsencesList />}

      {view === 'leaves' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/leave-new')}
          className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-[20px] bg-primary active:opacity-90"
          style={{
            shadowColor: '#2F5BFF',
            shadowOpacity: 0.5,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={28} color="white" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

function LeavesList() {
  const { t } = useTranslation();
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
        <ActivityIndicator color="#2F5BFF" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10 }}
      ListHeaderComponent={
        balance.data && balance.data.length > 0 ? (
          <Card className="mb-1 gap-3.5">
            <Text className="font-bodyBold text-[12px] uppercase tracking-wide text-muted dark:text-slate-400">
              {t('requests.balances')}
            </Text>
            <View className="gap-[15px]">
              {balance.data.slice(0, 4).map((b) => (
                <View key={b.type} className="gap-[7px]">
                  <View className="flex-row items-baseline justify-between">
                    <Text className="font-bodySemibold text-[13.5px] text-ink dark:text-white">
                      {getLeaveTypeLabel(t, b.type)}
                    </Text>
                    <Text className="font-display text-[15px] text-ink dark:text-white">
                      {b.remaining}
                      <Text className="font-bodySemibold text-[12px] text-muted dark:text-slate-400">
                        {` / ${b.total} j`}
                      </Text>
                    </Text>
                  </View>
                  <ProgressBar
                    value={b.remaining}
                    total={b.total}
                    tone={LEAVE_TYPE_TONE[b.type] ?? 'primary'}
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : null
      }
      renderItem={({ item }) => <LeaveCard leave={item} />}
      ListEmptyComponent={
        <View className="items-center gap-2 py-16">
          <Ionicons name="calendar-outline" size={36} color="#9AA5BE" />
          <Text className="font-body text-[15px] text-muted dark:text-slate-400">
            {t('requests.noLeaves')}
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
          tintColor="#2F5BFF"
        />
      }
    />
  );
}

function LeaveCard({ leave }: { leave: Leave }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? enUS : fr;
  return (
    <Card pad={16} radius={20} className="gap-2">
      <View className="flex-row items-start justify-between gap-2.5">
        <View className="flex-1">
          <Text className="font-bodyBold text-[15px] text-ink dark:text-white">
            {getLeaveTypeLabel(t, leave.type)}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={13} color="#717A90" />
            <Text className="font-body text-[12.5px] text-muted dark:text-slate-400">
              {format(new Date(leave.startDate), 'd MMM yyyy', { locale })} —{' '}
              {format(new Date(leave.endDate), 'd MMM yyyy', { locale })}
            </Text>
          </View>
        </View>
        <StatusPill tone={LEAVE_STATUS_TONE[leave.status]}>
          {getLeaveStatusLabel(t, leave.status)}
        </StatusPill>
      </View>
      {leave.reason ? (
        <Text className="font-body text-[13px] leading-5 text-muted dark:text-slate-400">
          {leave.reason}
        </Text>
      ) : null}
      {leave.rejectionReason ? (
        <View className="flex-row items-start gap-1.5 rounded-xl bg-danger/[0.09] px-3 py-2">
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginTop: 1 }} />
          <Text className="flex-1 font-body text-[12px] text-danger">
            {t('requests.rejectionReason', { reason: leave.rejectionReason })}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function AbsencesList() {
  const { t } = useTranslation();
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
    for (const p of query.data?.pages ?? []) out.push(...(p.data ?? p.items ?? p.absences ?? []));
    return out;
  }, [query.data]);

  if (query.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#2F5BFF" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 10 }}
      renderItem={({ item }) => (
        <AbsenceCard
          absence={item}
          onJustify={() => router.push(`/justify-absence?id=${item.id}`)}
        />
      )}
      ListEmptyComponent={
        <View className="items-center gap-2 py-16">
          <Ionicons name="checkmark-circle-outline" size={36} color="#16A34A" />
          <Text className="font-body text-[15px] text-muted dark:text-slate-400">
            {t('requests.noAbsences')}
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
          tintColor="#2F5BFF"
        />
      }
    />
  );
}

function AbsenceCard({ absence, onJustify }: { absence: Absence; onJustify: () => void }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? enUS : fr;
  return (
    <Card pad={16} radius={20} className="gap-2">
      <View className="flex-row items-start justify-between gap-2.5">
        <View className="flex-1">
          <Text className="font-bodyBold text-[15px] text-ink dark:text-white">
            {getAbsenceTypeLabel(t, absence.type)}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={13} color="#717A90" />
            <Text className="font-body text-[12.5px] text-muted dark:text-slate-400">
              {format(new Date(absence.date), 'EEEE d MMMM yyyy', { locale })}
            </Text>
          </View>
        </View>
        <StatusPill tone={ABSENCE_STATUS_TONE[absence.status]}>
          {getAbsenceStatusLabel(t, absence.status)}
        </StatusPill>
      </View>
      {absence.reason ? (
        <Text className="font-body text-[13px] leading-5 text-muted dark:text-slate-400">
          {absence.reason}
        </Text>
      ) : null}
      {canJustify(absence.status) ? (
        <Pressable
          accessibilityRole="button"
          onPress={onJustify}
          className="flex-row items-center gap-1.5 self-start rounded-full bg-primary/10 px-4 py-2 active:opacity-80"
        >
          <Ionicons name="document-attach-outline" size={14} color="#2F5BFF" />
          <Text className="font-bodyBold text-[12.5px] text-primary">{t('requests.justify')}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
