import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Stack } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import type { AdminAbsence } from '~/api/admin';
import { humanizeApiError } from '~/api/client';
import { RoleGate } from '~/components/RoleGate';
import { useAdminActions, usePendingAbsences } from '~/hooks/useAdminData';
import { ABSENCE_TYPE_LABELS } from '~/lib/absences';

export default function AdminAbsencesScreen() {
  return (
    <RoleGate roles={['ADMIN', 'HR']} fallback={<Forbidden />}>
      <AbsencesContent />
    </RoleGate>
  );
}

function AbsencesContent() {
  const query = usePendingAbsences();
  const { approveAbsenceMutation, rejectAbsenceMutation } = useAdminActions();

  const items = useMemo<AdminAbsence[]>(() => {
    const out: AdminAbsence[] = [];
    for (const page of query.data?.pages ?? []) out.push(...(page.data ?? page.items ?? []));
    return out;
  }, [query.data]);

  const approve = (id: string) => {
    approveAbsenceMutation.mutate(id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Absence approuvee' }),
      onError: (error) => Toast.show({ type: 'error', text1: humanizeApiError(error) }),
    });
  };

  const reject = (id: string) => {
    Alert.alert('Rejeter la justification', 'Marquer cette absence comme non justifiee ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Rejeter',
        style: 'destructive',
        onPress: () =>
          rejectAbsenceMutation.mutate(id, {
            onSuccess: () => Toast.show({ type: 'success', text1: 'Absence rejetee' }),
            onError: (error) => Toast.show({ type: 'error', text1: humanizeApiError(error) }),
          }),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: true, title: 'Absences en attente' }} />
      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 10 }}
          renderItem={({ item }) => (
            <AbsenceRow
              absence={item}
              approving={approveAbsenceMutation.isPending}
              rejecting={rejectAbsenceMutation.isPending}
              onApprove={() => approve(item.id)}
              onReject={() => reject(item.id)}
            />
          )}
          ListEmptyComponent={<Empty />}
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
      )}
    </SafeAreaView>
  );
}

function AbsenceRow({
  absence,
  approving,
  rejecting,
  onApprove,
  onReject,
}: {
  absence: AdminAbsence;
  approving: boolean;
  rejecting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const name = absence.user ? `${absence.user.firstName} ${absence.user.lastName}` : 'Employe';
  return (
    <View className="rounded-2xl bg-white dark:bg-slate-900 p-4 gap-3 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">{name}</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {absence.user?.department ?? 'Departement non defini'}
          </Text>
        </View>
        <View className="rounded-full bg-warning/15 px-3 py-1">
          <Text className="text-xs font-semibold text-warning">
            {ABSENCE_TYPE_LABELS[absence.type]}
          </Text>
        </View>
      </View>
      <Text className="text-sm text-slate-600 dark:text-slate-300">
        {format(new Date(absence.date), 'EEEE d MMMM yyyy', { locale: fr })}
      </Text>
      {absence.reason ? (
        <Text className="text-sm text-slate-500 dark:text-slate-400">{absence.reason}</Text>
      ) : null}
      <View className="flex-row gap-2">
        <ActionButton label="Approuver" loading={approving} tone="success" onPress={onApprove} />
        <ActionButton label="Rejeter" loading={rejecting} tone="danger" onPress={onReject} />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  loading,
  tone,
  onPress,
}: {
  label: string;
  loading: boolean;
  tone: 'success' | 'danger';
  onPress: () => void;
}) {
  const classes =
    tone === 'success'
      ? 'bg-success/10 text-success'
      : 'bg-danger/10 text-danger';
  const textClass = tone === 'success' ? 'text-success' : 'text-danger';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      className={`h-11 flex-1 rounded-xl items-center justify-center ${classes}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tone === 'success' ? '#2F855A' : '#991B1B'} />
      ) : (
        <Text className={`text-sm font-semibold ${textClass}`}>{label}</Text>
      )}
    </Pressable>
  );
}

function Empty() {
  return (
    <View className="items-center py-20 gap-2">
      <Ionicons name="checkmark-circle" size={40} color="#2F855A" />
      <Text className="text-base text-slate-500 dark:text-slate-400">
        Aucune absence en attente.
      </Text>
    </View>
  );
}

function Forbidden() {
  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark items-center justify-center">
      <Text className="text-slate-500 dark:text-slate-400">Acces reserve.</Text>
    </SafeAreaView>
  );
}
