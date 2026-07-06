import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import { NotificationsSheet } from "~/components/NotificationsSheet";
import { AdminIcon } from "~/components/admin/AdminIcon";
import { Donut, MiniBars, Sparkline } from "~/components/admin/charts";
import { longDate, weekdayLetter } from "~/components/admin/format";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  IconBtn,
  KPITile,
  SectionTitle,
} from "~/components/admin/primitives";
import { FONT } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import {
  useAdminOverview,
  useAdminPendingCounts,
  useAdminPresence,
  useLivePresence,
} from "~/hooks/useAdminData";
import { useAuthStore } from "~/stores/auth.store";

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const p = useAdminTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const overview = useAdminOverview();
  const counts = useAdminPendingCounts();
  const presence = useAdminPresence(7);
  const live = useLivePresence();

  if (overview.isLoading || counts.isLoading || live.isLoading) {
    return (
      <AdminScrollBody>
        <View style={{ paddingTop: 80, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      </AdminScrollBody>
    );
  }

  const o = overview.data;
  const total = o?.totalEmployees ?? 0;
  const active = o?.activeEmployees ?? 0;
  const rate = Math.round(o?.attendanceRate ?? 0);
  const punctuality = Math.round(o?.punctualityRate ?? 0);
  const pendingTotal = counts.data?.total ?? 0;
  const pendingLeaves = counts.data?.leaves ?? 0;
  const pendingAbsences = counts.data?.absences ?? 0;
  const pendingDevices = counts.data?.devices ?? 0;
  const pendingPhotos = counts.data?.photos ?? 0;

  // Présence du jour (état réel par employé) : les KPI « Présents »/« Retards »
  // et le donut reflètent la journée courante — dès le premier pointage — et
  // non les comptes actifs ou les cumuls 30 jours. Repli sur l'overview si la
  // liste live est indisponible.
  const entries = live.data ?? [];
  const st = { present: 0, late: 0, out: 0, leave: 0, absent: 0, pending: 0 };
  for (const e of entries) st[e.state] += 1;
  const hasLive = entries.length > 0;
  const totalEmp = hasLive ? entries.length : total;
  const checkedToday = st.present + st.late + st.out;
  const lateToday = hasLive ? st.late : (o?.lateArrivals ?? 0);
  const absentToday = hasLive ? st.absent + st.pending : Math.max(0, total - active);
  const todayRate = totalEmp > 0 ? Math.round((checkedToday / totalEmp) * 100) : 0;
  const presentLabel = hasLive ? `${checkedToday}/${totalEmp}` : `${active}/${total}`;
  const donutRate = hasLive ? todayRate : rate;

  const donutSegments = hasLive
    ? [
        { value: st.present, color: p.success },
        { value: st.late, color: p.warning },
        { value: st.out, color: p.primary },
        { value: st.leave + st.absent + st.pending, color: p.muted2 },
      ]
    : [
        { value: Math.max(0, active - lateToday), color: p.success },
        { value: lateToday, color: p.warning },
        { value: Math.max(0, total - active), color: p.muted2 },
      ];
  const legend: [string, number, string][] = hasLive
    ? [
        [t("admin.bo.dashboard.legendAtWork"), st.present, p.success],
        [t("admin.bo.dashboard.legendLate"), st.late, p.warning],
        [t("admin.bo.dashboard.legendOut"), st.out, p.primary],
        [t("admin.bo.dashboard.legendNotIn"), st.leave + st.absent + st.pending, p.muted2],
      ]
    : [
        [t("admin.bo.dashboard.legendAtWork"), Math.max(0, active - lateToday), p.success],
        [t("admin.bo.dashboard.legendLate"), lateToday, p.warning],
        [t("admin.bo.dashboard.legendAbsent"), Math.max(0, total - active), p.muted2],
      ];

  // Présence des 7 derniers jours → barres semaine + sparkline arrivées.
  const points = presence.data ?? [];
  const week = points.map((pt) => ({
    label: weekdayLetter(pt.date),
    v: pt.onTime + pt.late,
  }));
  const arrivals = points.map((pt) => pt.onTime + pt.late);
  const todayArrivals = arrivals.length ? arrivals[arrivals.length - 1] : 0;

  return (
    <>
    <AdminScrollBody>
      <AdminHeader
        sub={user?.department ? `SmartAttendance · ${user.department}` : "SmartAttendance"}
        title={t("admin.bo.dashboard.greeting", { name: user?.firstName ?? "" }).replace(/,\s*$/, "")}
        right={
          <IconBtn
            icon="bell"
            badge={pendingTotal}
            onPress={() => setNotifOpen(true)}
          />
        }
      />
      <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: p.muted, marginTop: -4 }}>
        {longDate()}
      </Text>

      {/* KPI grid 2×2 */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <KPITile icon="users" label={t("admin.bo.dashboard.present")} value={presentLabel} tone="primary" />
          <KPITile
            icon="checkCircle"
            label={t("admin.bo.dashboard.attendanceRate")}
            value={`${rate}%`}
            tone="success"
            sub={t("admin.bo.dashboard.goal")}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <KPITile icon="clockSmall" label={t("admin.bo.dashboard.late")} value={lateToday} tone="warning" />
          <KPITile icon="award" label={t("admin.bo.dashboard.punctuality")} value={`${punctuality}%`} tone="accent" />
        </View>
      </View>

      {/* Donut présence en direct */}
      <Card>
        <SectionTitle action={t("admin.bo.dashboard.detail")} onAction={() => router.push("/(admin)/(home)/presence")}>
          {t("admin.bo.dashboard.livePresence")}
        </SectionTitle>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18, marginTop: 8 }}>
          <Donut
            segments={donutSegments}
            centerTop={`${donutRate}%`}
            centerBottom={t(hasLive ? "admin.bo.dashboard.checkedToday" : "admin.bo.dashboard.atWork")}
          />
          <View style={{ flex: 1, gap: 9 }}>
            {legend.map(([l, v, c]) => (
              <View key={l} style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: c }} />
                <Text style={{ flex: 1, fontFamily: FONT.body, fontSize: 13, color: p.muted }}>{l}</Text>
                <Text style={{ fontFamily: FONT.display, fontSize: 14.5, color: p.ink }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* Arrivées + semaine */}
      <View style={{ flexDirection: "row", gap: 11 }}>
        <Card pad={15} style={{ flex: 1, gap: 6 }}>
          <Text
            style={{
              fontFamily: FONT.bold,
              fontSize: 11.5,
              color: p.muted,
              letterSpacing: 0.2,
              textTransform: "uppercase",
            }}
          >
            {t("admin.bo.dashboard.arrivals")}
          </Text>
          <Text style={{ fontFamily: FONT.display, fontSize: 22, color: p.ink, letterSpacing: -0.5 }}>
            {todayArrivals}
            <Text style={{ fontSize: 12.5, color: p.muted }}> {t("admin.bo.dashboard.today")}</Text>
          </Text>
          <View style={{ marginTop: 2 }}>
            {arrivals.length > 1 ? (
              <Sparkline data={arrivals} width={138} height={42} />
            ) : (
              <View style={{ height: 42 }} />
            )}
          </View>
        </Card>
        <Card pad={15} style={{ flex: 1, gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text
              style={{
                fontFamily: FONT.bold,
                fontSize: 11.5,
                color: p.muted,
                letterSpacing: 0.2,
                textTransform: "uppercase",
              }}
            >
              {t("admin.bo.dashboard.week")}
            </Text>
          </View>
          {week.length ? (
            <MiniBars data={week} accentIndex={week.length - 1} height={64} />
          ) : (
            <View style={{ height: 64 }} />
          )}
        </Card>
      </View>

      {/* Bannière de validation */}
      <Card onPress={() => router.push("/(admin)/(home)/valider")} style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            backgroundColor: "rgba(47,91,255,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AdminIcon name="doc" size={22} color={p.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 16, color: p.ink }}>
            {t("admin.bo.dashboard.toValidate", { count: pendingTotal })}
          </Text>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
            {t("admin.bo.dashboard.breakdown", { leaves: pendingLeaves, absences: pendingAbsences, devices: pendingDevices, photos: pendingPhotos })}
          </Text>
        </View>
        <AdminIcon name="chevron" size={20} color={p.muted2} />
      </Card>

      {/* Alertes du jour (dérivées des compteurs réels) */}
      <SectionTitle>{t("admin.bo.dashboard.alerts")}</SectionTitle>
      <View style={{ gap: 9 }}>
        {lateToday > 0 ? (
          <AlertRow icon="clockSmall" tone={p.warning} bg="rgba(245,158,11,0.16)" title={t("admin.bo.dashboard.alertLate", { count: lateToday })} body={t("admin.bo.dashboard.alertLateBody")} />
        ) : null}
        {pendingTotal > 0 ? (
          <AlertRow icon="doc" tone={p.primary} bg="rgba(47,91,255,0.12)" title={t("admin.bo.dashboard.alertPending", { count: pendingTotal })} body={t("admin.bo.dashboard.breakdown", { leaves: pendingLeaves, absences: pendingAbsences, devices: pendingDevices, photos: pendingPhotos })} />
        ) : null}
        {absentToday > 0 ? (
          <AlertRow icon="bell" tone={p.accent} bg="rgba(255,138,61,0.16)" title={t("admin.bo.dashboard.alertAbsent", { count: absentToday })} body={t("admin.bo.dashboard.alertAbsentBody")} />
        ) : null}
        {lateToday === 0 && pendingTotal === 0 && absentToday === 0 ? (
          <Card soft pad={16}>
            <Text style={{ fontFamily: FONT.body, fontSize: 13, color: p.muted, textAlign: "center" }}>
              {t("admin.bo.dashboard.allClear")}
            </Text>
          </Card>
        ) : null}
      </View>
    </AdminScrollBody>
    <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}

function AlertRow({
  icon,
  tone,
  bg,
  title,
  body,
}: {
  icon: string;
  tone: string;
  bg: string;
  title: string;
  body: string;
}) {
  const p = useAdminTheme();
  return (
    <Card soft pad={13} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
        <AdminIcon name={icon} size={19} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>{title}</Text>
        <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
          {body}
        </Text>
      </View>
    </Card>
  );
}
