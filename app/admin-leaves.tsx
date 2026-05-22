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

import type { AdminLeave } from '~/api/admin';
import { humanizeApiError } from '~/api/client';
import { RoleGate } from '~/components/RoleGate';
import { useAdminActions, usePendingLeaves } from '~/hooks/useAdminData';
import { LEAVE_TYPE_LABELS } from '~/lib/leaves';

export default function AdminLeavesScreen() {
  return (
    <RoleGate roles={['ADMIN', 'HR']} fallback={<Forbidden />}>
      <LeavesContent />
    </RoleGate>
  );
}

function LeavesContent() {
  const query = usePendingLeaves();
  const { approveLeaveMutation, rejectLeaveMutation } = useAdminActions();

  const items = useMemo<AdminLeave[]>(() => {
    const out: AdminLeave[] = [];
    for (const page of query.data?.pages ?? []) out.push(...(page.data ?? page.items ?? []));
    return out;
  }, [query.data]);

  const approve = (id: string) => {
    approveLeaveMutation.mutate(id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Conge approuve' }),
      onError: (error) => Toast.show({ type: 'error', text1: humanizeApiError(error) }),
    });
  };

  const reject = (id: string) => {
    Alert.alert('Rejeter le conge', 'Confirmer le rejet de cette demande ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Rejeter',
        style: 'destructive',
        onPress: () =>
          rejectLeaveMutation.mutate(
            { id, comment: 'Rejete depuis mobile' },
            {
              onSuccess: () => Toast.show({ type: 'success', text1: 'Conge rejete' }),
              onError: (error) => Toast.show({ type: 'error', text1: humanizeApiError(error) }),
            },
          ),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
      <Stack.Screen options={{ headerShown: true, title: 'Conges en attente' }} />
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
            <LeaveRow
              leave={item}
              approving={approveLeaveMutation.isPending}
              rejecting={rejectLeaveMutation.isPending}
              onApprove={() => approve(item.id)}
              onReject={() => reject(item.id)}
            />
          )}
          ListEmptyComponent={<Empty label="Aucun conge en attente." icon="checkmark-circle" />}
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

function LeaveRow({
  leave,
  approving,
  rejecting,
  onApprove,
  onReject,
}: {
  leave: AdminLeave;
  approving: boolean;
  rejecting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const name = leave.user ? `${leave.user.firstName} ${leave.user.lastName}` : 'Employe';
  return (
    <View className="rounded-2xl bg-white dark:bg-slate-900 p-4 gap-3 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">{name}</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {LEAVE_TYPE_LABELS[leave.type]}
          </Text>
        </View>
        {leave.days ? (
          <Text className="text-xs font-semibold text-primary-700 dark:text-primary-100">
            {leave.days} j
          </Text>
        ) : null}
      </View>
      <Text className="text-sm text-slate-600 dark:text-slate-300">
        {format(new Date(leave.startDate), 'd MMM yyyy', { locale: fr })} -{' '}
        {format(new Date(leave.endDate), 'd MMM yyyy', { locale: fr })}
      </Text>
      {leave.reason ? (
        <Text className="text-sm text-slate-500 dark:text-slate-400">{leave.reason}</Text>
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

function Empty({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="items-center py-20 gap-2">
      <Ionicons name={icon} size={40} color="#2F855A" />
      <Text className="text-base text-slate-500 dark:text-slate-400">{label}</Text>
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
