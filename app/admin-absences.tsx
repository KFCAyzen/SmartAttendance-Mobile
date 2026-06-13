import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

import type { AdminAbsence } from "~/api/admin";
import { humanizeApiError } from "~/api/client";
import { feedback } from "~/components/feedback";
import { RoleGate } from "~/components/RoleGate";
import { useAdminActions, usePendingAbsences } from "~/hooks/useAdminData";
import { getAbsenceTypeLabel } from "~/lib/absences";

export default function AdminAbsencesScreen() {
  return (
    <RoleGate roles={["ADMIN", "HR"]} fallback={<Forbidden />}>
      <AbsencesContent />
    </RoleGate>
  );
}

function AbsencesContent() {
  const { t } = useTranslation();
  const query = usePendingAbsences();
  const { approveAbsenceMutation, rejectAbsenceMutation } = useAdminActions();

  const items = useMemo<AdminAbsence[]>(() => {
    const out: AdminAbsence[] = [];
    for (const page of query.data?.pages ?? [])
      out.push(...(page.data ?? page.items ?? []));
    return out;
  }, [query.data]);

  const approve = (id: string) => {
    approveAbsenceMutation.mutate(
      { id, comment: t("admin.approvedFromMobile") },
      {
        onSuccess: () => feedback.success(t("admin.absenceApproved")),
        onError: (error) => feedback.error(humanizeApiError(error)),
      },
    );
  };

  // Rejet réversible (cf. admin-leaves) : l'envoi réseau est différé le temps de la
  // snackbar ; ANNULER annule l'effet, ce qui remplace la confirmation modale.
  const reject = (id: string) => {
    let cancelled = false;
    feedback.undo({
      title: t("admin.absenceRejected"),
      actionLabel: t("common.cancel"),
      onUndo: () => {
        cancelled = true;
      },
      duration: 5000,
    });
    setTimeout(() => {
      if (cancelled) return;
      rejectAbsenceMutation.mutate(
        { id, comment: t("admin.rejectedFromMobile") },
        { onError: (error) => feedback.error(humanizeApiError(error)) },
      );
    }, 5000);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
      <Stack.Screen
        options={{ headerShown: true, title: t("admin.pendingAbsences") }}
      />
      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3B82F6" />
        </View>
      ) : query.isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Ionicons name="cloud-offline" size={40} color="#C2410C" />
          <Text className="text-center text-base text-slate-600 dark:text-slate-300">
            {humanizeApiError(query.error)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void query.refetch()}
            className="mt-2 h-11 px-6 rounded-xl bg-primary items-center justify-center active:opacity-80"
          >
            <Text className="text-white font-semibold">{t("common.retry")}</Text>
          </Pressable>
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
            if (query.hasNextPage && !query.isFetchingNextPage)
              void query.fetchNextPage();
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
  const { t } = useTranslation();
  const name = absence.user
    ? `${absence.user.firstName} ${absence.user.lastName}`
    : t("admin.employee");
  return (
    <View className="rounded-2xl bg-white dark:bg-slate-900 p-4 gap-3 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            {name}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {absence.user?.department ?? t("admin.unknownDepartment")}
          </Text>
        </View>
        <View className="rounded-full bg-warning/15 px-3 py-1">
          <Text className="text-xs font-semibold text-warning">
            {getAbsenceTypeLabel(t, absence.type)}
          </Text>
        </View>
      </View>
      <Text className="text-sm text-slate-600 dark:text-slate-300">
        {format(new Date(absence.date), "EEEE d MMMM yyyy", { locale: fr })}
      </Text>
      {absence.reason ? (
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          {absence.reason}
        </Text>
      ) : null}
      <View className="flex-row gap-2">
        <ActionButton
          label={t("admin.approve")}
          loading={approving}
          tone="success"
          onPress={onApprove}
        />
        <ActionButton
          label={t("admin.reject")}
          loading={rejecting}
          tone="danger"
          onPress={onReject}
        />
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
  tone: "success" | "danger";
  onPress: () => void;
}) {
  const classes =
    tone === "success"
      ? "bg-success/10 text-success"
      : "bg-danger/10 text-danger";
  const textClass = tone === "success" ? "text-success" : "text-danger";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      className={`h-11 flex-1 rounded-xl items-center justify-center ${classes}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={tone === "success" ? "#2F855A" : "#991B1B"}
        />
      ) : (
        <Text className={`text-sm font-semibold ${textClass}`}>{label}</Text>
      )}
    </Pressable>
  );
}

function Empty() {
  const { t } = useTranslation();
  return (
    <View className="items-center py-20 gap-2">
      <Ionicons name="checkmark-circle" size={40} color="#2F855A" />
      <Text className="text-base text-slate-500 dark:text-slate-400">
        {t("admin.noPendingAbsences")}
      </Text>
    </View>
  );
}

function Forbidden() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark items-center justify-center">
      <Text className="text-slate-500 dark:text-slate-400">
        {t("admin.reserved")}
      </Text>
    </SafeAreaView>
  );
}
