import { useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

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
} from "~/hooks/useAdminData";
import { useAuthStore } from "~/stores/auth.store";

export default function DashboardScreen() {
  const router = useRouter();
  const p = useAdminTheme();
  const user = useAuthStore((s) => s.user);
  const overview = useAdminOverview();
  const counts = useAdminPendingCounts();
  const presence = useAdminPresence(7);

  if (overview.isLoading || counts.isLoading) {
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
  const late = o?.lateArrivals ?? 0;
  const rate = Math.round(o?.attendanceRate ?? 0);
  const punctuality = Math.round(o?.punctualityRate ?? 0);
  const absent = Math.max(0, total - active);
  const pendingTotal = counts.data?.total ?? 0;
  const pendingLeaves = counts.data?.leaves ?? 0;
  const pendingAbsences = counts.data?.absences ?? 0;

  const donutSegments = [
    { value: Math.max(0, active - late), color: p.success },
    { value: late, color: p.warning },
    { value: absent, color: p.muted2 },
  ];
  const legend: [string, number, string][] = [
    ["Au travail", Math.max(0, active - late), p.success],
    ["En retard", late, p.warning],
    ["Absent", absent, p.muted2],
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
    <AdminScrollBody>
      <AdminHeader
        sub={user?.department ? `SmartAttendance · ${user.department}` : "SmartAttendance"}
        title={`Bonjour, ${user?.firstName ?? ""}`.trim()}
        right={
          <IconBtn
            icon="bell"
            badge={pendingTotal}
            onPress={() => router.push("/notifications")}
          />
        }
      />
      <Text style={{ fontFamily: FONT.medium, fontSize: 14, color: p.muted, marginTop: -4 }}>
        {longDate()}
      </Text>

      {/* KPI grid 2×2 */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <KPITile icon="users" label="Présents" value={`${active}/${total}`} tone="primary" />
          <KPITile
            icon="checkCircle"
            label="Taux de présence"
            value={`${rate}%`}
            tone="success"
            sub="Objectif 90%"
          />
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <KPITile icon="clockSmall" label="Retards" value={late} tone="warning" />
          <KPITile icon="award" label="Ponctualité" value={`${punctuality}%`} tone="accent" />
        </View>
      </View>

      {/* Donut présence en direct */}
      <Card>
        <SectionTitle action="Détail" onAction={() => router.push("/(admin)/presence")}>
          Présence en direct
        </SectionTitle>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18, marginTop: 8 }}>
          <Donut segments={donutSegments} centerTop={`${rate}%`} centerBottom="au travail" />
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
            Arrivées
          </Text>
          <Text style={{ fontFamily: FONT.display, fontSize: 22, color: p.ink, letterSpacing: -0.5 }}>
            {todayArrivals}
            <Text style={{ fontSize: 12.5, color: p.muted }}> aujourd&apos;hui</Text>
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
              Semaine
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
      <Card onPress={() => router.push("/(admin)/valider")} style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
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
            {pendingTotal} demande{pendingTotal > 1 ? "s" : ""} à valider
          </Text>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
            {pendingLeaves} congés · {pendingAbsences} absences
          </Text>
        </View>
        <AdminIcon name="chevron" size={20} color={p.muted2} />
      </Card>

      {/* Alertes du jour (dérivées des compteurs réels) */}
      <SectionTitle>Alertes du jour</SectionTitle>
      <View style={{ gap: 9 }}>
        {late > 0 ? (
          <AlertRow icon="clockSmall" tone={p.warning} bg="rgba(245,158,11,0.16)" title={`${late} retard${late > 1 ? "s" : ""} aujourd'hui`} body="Pointages après 09:00" />
        ) : null}
        {pendingTotal > 0 ? (
          <AlertRow icon="doc" tone={p.primary} bg="rgba(47,91,255,0.12)" title={`${pendingTotal} demandes à valider`} body={`${pendingLeaves} congés · ${pendingAbsences} absences`} />
        ) : null}
        {absent > 0 ? (
          <AlertRow icon="bell" tone={p.accent} bg="rgba(255,138,61,0.16)" title={`${absent} employé${absent > 1 ? "s" : ""} non présent${absent > 1 ? "s" : ""}`} body="Sur l'effectif total" />
        ) : null}
        {late === 0 && pendingTotal === 0 && absent === 0 ? (
          <Card soft pad={16}>
            <Text style={{ fontFamily: FONT.body, fontSize: 13, color: p.muted, textAlign: "center" }}>
              Aucune alerte. Tout est à jour.
            </Text>
          </Card>
        ) : null}
      </View>
    </AdminScrollBody>
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
