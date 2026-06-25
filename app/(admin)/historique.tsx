import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import type { AdminAttendanceRow, AdminLeaveRow } from "~/api/admin";
import { AdminIcon } from "~/components/admin/AdminIcon";
import { initialsOf } from "~/components/admin/format";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  EmpAvatar,
  FilterChips,
  Pill,
  Segmented,
} from "~/components/admin/primitives";
import { FONT, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import i18n from "~/i18n";
import { useAdminAttendances, useAdminLeaves } from "~/hooks/useAdminData";

type HistTab = "attendance" | "leave";

const localeOf = () => (i18n.language?.startsWith("en") ? "en-US" : "fr-FR");

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(localeOf(), { day: "numeric", month: "short" })} · ${d.toLocaleTimeString(
    localeOf(),
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString(localeOf(), { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  CANCELLED: "neutral",
  INTERRUPTED: "neutral",
};

export default function AdminHistoryScreen() {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState<HistTab>("attendance");
  const [status, setStatus] = useState("all");

  const attendances = useAdminAttendances(100);
  const leaves = useAdminLeaves(status === "all" ? undefined : status);

  const attendanceRows = attendances.data ?? [];
  const leaveRows = leaves.data ?? [];
  const loading = tab === "attendance" ? attendances.isLoading : leaves.isLoading;
  const refreshing = tab === "attendance" ? attendances.isRefetching : leaves.isRefetching;
  const onRefresh = () => (tab === "attendance" ? attendances.refetch() : leaves.refetch());
  const count = tab === "attendance" ? attendanceRows.length : leaveRows.length;

  const statusChips = [
    { key: "all", label: t("admin.bo.historique.filterAll") },
    { key: "PENDING", label: t("admin.bo.historique.statusPENDING") },
    { key: "APPROVED", label: t("admin.bo.historique.statusAPPROVED") },
    { key: "REJECTED", label: t("admin.bo.historique.statusREJECTED") },
  ];

  return (
    <AdminScrollBody gap={12} refreshing={refreshing} onRefresh={onRefresh}>
      <AdminHeader
        backLabel={t("admin.bo.nav.more")}
        sub={t("admin.bo.historique.sub")}
        title={t("admin.bo.historique.title")}
      />
      <Segmented
        value={tab}
        onChange={(k) => setTab(k as HistTab)}
        options={[
          { key: "attendance", label: t("admin.bo.historique.tabAttendance") },
          { key: "leave", label: t("admin.bo.historique.tabLeaves") },
        ]}
      />

      {tab === "leave" ? <FilterChips options={statusChips} value={status} onChange={setStatus} /> : null}

      {loading ? (
        <View style={{ paddingTop: 50, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : count === 0 ? (
        <Card soft style={{ alignItems: "center", paddingVertical: 24 }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
            {t("admin.bo.historique.empty")}
          </Text>
        </Card>
      ) : tab === "attendance" ? (
        <Card pad={0} style={{ overflow: "hidden" }}>
          {attendanceRows.map((row, i) => (
            <AttendanceItem key={row.id} row={row} last={i === attendanceRows.length - 1} />
          ))}
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {leaveRows.map((row) => (
            <LeaveItem key={row.id} row={row} />
          ))}
        </View>
      )}
    </AdminScrollBody>
  );
}

function AttendanceItem({ row, last }: { row: AdminAttendanceRow; last: boolean }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const isIn = row.type === "CHECK_IN";
  const tone = isIn ? p.success : p.warning;
  const name = row.user ? `${row.user.firstName} ${row.user.lastName}` : t("admin.bo.common.employee");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: p.line,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: withAlpha(tone, 0.14),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AdminIcon name={isIn ? "scan" : "logout"} size={18} color={tone} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>
          {name}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 11.5, color: p.muted }}>
          {row.user?.department || "—"} · {fmtDateTime(row.timestamp)}
        </Text>
      </View>
      <Text style={{ fontFamily: FONT.bold, fontSize: 11.5, color: tone }}>
        {isIn ? t("admin.bo.historique.checkIn") : t("admin.bo.historique.checkOut")}
      </Text>
    </View>
  );
}

function LeaveItem({ row }: { row: AdminLeaveRow }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const name = row.user?.name || t("admin.bo.common.employee");
  const range =
    row.startDate === row.endDate ? fmtDay(row.startDate) : `${fmtDay(row.startDate)} – ${fmtDay(row.endDate)}`;

  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <EmpAvatar name={name} initials={initialsOf(name.split(" ")[0], name.split(" ")[1])} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>
          {name}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 11.5, color: p.muted }}>
          {t(`leaveTypes.${row.type}`)} · {range}
        </Text>
      </View>
      <Pill tone={STATUS_TONE[row.status] ?? "neutral"} dot>
        {t(`admin.bo.historique.status${row.status}`)}
      </Pill>
    </Card>
  );
}
