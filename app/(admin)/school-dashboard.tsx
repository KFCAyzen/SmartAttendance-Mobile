import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";

import {
  AdminHeader,
  AdminScrollBody,
  Card,
  EmpAvatar,
  KPITile,
  Pill,
  SectionTitle,
  Segmented,
} from "~/components/admin/primitives";
import { FONT } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import {
  useSchoolAbsenteeismList,
  useSchoolClassBreakdown,
  useSchoolOverview,
  useSchoolPresenceTrend,
} from "~/hooks/useAdminData";

const PERIOD_DAYS: Record<string, number> = { week: 7, month: 30, quarter: 90 };
// La tendance journalière reste lisible sur mobile même quand la période est
// large (30/90 j) : on affiche toujours les 14 derniers jours au maximum.
const TREND_MAX_POINTS = 14;

export default function SchoolDashboardScreen() {
  const p = useAdminTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? enUS : fr;
  const [period, setPeriod] = useState("month");
  const days = PERIOD_DAYS[period] ?? 30;

  const overview = useSchoolOverview(days);
  const presence = useSchoolPresenceTrend(days);
  const classes = useSchoolClassBreakdown(days);
  const absenteeism = useSchoolAbsenteeismList(days);

  const o = overview.data;
  const trend = (presence.data ?? []).slice(-TREND_MAX_POINTS);
  const maxTrend = Math.max(1, ...trend.map((d) => d.present + d.absent));
  const classRows = classes.data ?? [];
  const maxClass = Math.max(1, ...classRows.map((c) => c.studentCount));
  const students = absenteeism.data?.students ?? [];

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader
        backLabel={t("admin.bo.nav.more")}
        sub={t("admin.bo.schoolDashboard.sub")}
        title={t("admin.bo.schoolDashboard.title")}
      />
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { key: "week", label: t("admin.bo.reports.week") },
          { key: "month", label: t("admin.bo.reports.month") },
          { key: "quarter", label: t("admin.bo.reports.quarter") },
        ]}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <KPITile
          icon="checkCircle"
          tone="success"
          label={t("admin.bo.schoolDashboard.presentToday")}
          value={o ? o.presentToday : "—"}
          sub={o ? `${o.presentRate}%` : undefined}
        />
        <KPITile
          icon="ban"
          tone="danger"
          label={t("admin.bo.schoolDashboard.absentToday")}
          value={o ? o.absentToday : "—"}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <KPITile
          icon="pulse"
          tone="primary"
          label={t("admin.bo.schoolDashboard.absenceRate")}
          value={o ? `${o.absenceRate}%` : "—"}
        />
        <KPITile
          icon="bell"
          tone="warning"
          label={t("admin.bo.schoolDashboard.chronicAbsentees")}
          value={o ? o.chronicAbsenteesCount : "—"}
          sub={o ? t("admin.bo.schoolDashboard.chronicThreshold", { n: o.chronicThreshold }) : undefined}
        />
      </View>

      <Card>
        <SectionTitle>{t("admin.bo.schoolDashboard.presenceTrend")}</SectionTitle>
        {presence.isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={p.primary} />
          </View>
        ) : trend.length === 0 ? (
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted, marginTop: 12 }}>
            {t("admin.bo.reports.noPresence")}
          </Text>
        ) : (
          <View style={{ gap: 10, marginTop: 14 }}>
            {trend.map((d) => {
              const total = d.present + d.absent;
              const pct = total > 0 ? Math.round((d.present / total) * 100) : 0;
              const color = pct >= 90 ? p.success : pct >= 75 ? p.primary : p.warning;
              return (
                <View key={d.date} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ width: 44, fontFamily: FONT.semibold, fontSize: 11.5, color: p.ink }}>
                    {format(new Date(d.date), "d MMM", { locale })}
                  </Text>
                  <View style={{ flex: 1, height: 9, borderRadius: 999, backgroundColor: p.line, overflow: "hidden" }}>
                    <View
                      style={{
                        width: `${(total / maxTrend) * 100}%`,
                        height: "100%",
                        borderRadius: 999,
                        backgroundColor: color,
                      }}
                    />
                  </View>
                  <Text style={{ width: 40, textAlign: "right", fontFamily: FONT.display, fontSize: 13, color: p.ink }}>
                    {d.present}/{total}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <Card>
        <SectionTitle>{t("admin.bo.schoolDashboard.byClass")}</SectionTitle>
        {classes.isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={p.primary} />
          </View>
        ) : classRows.length === 0 ? (
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted, marginTop: 12 }}>
            {t("admin.bo.reports.noPresence")}
          </Text>
        ) : (
          <View style={{ gap: 12, marginTop: 14 }}>
            {classRows.map((c) => {
              const pct = c.studentCount > 0 ? Math.round((c.presentToday / c.studentCount) * 100) : 0;
              const color = pct >= 90 ? p.success : pct >= 75 ? p.primary : p.warning;
              return (
                <View key={c.teamId ?? "none"} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text numberOfLines={1} style={{ width: 92, fontFamily: FONT.semibold, fontSize: 12.5, color: p.ink }}>
                    {c.team ?? t("admin.bo.schoolDashboard.unassigned")}
                  </Text>
                  <View style={{ flex: 1, height: 9, borderRadius: 999, backgroundColor: p.line, overflow: "hidden" }}>
                    <View
                      style={{
                        width: `${(c.studentCount / maxClass) * 100}%`,
                        height: "100%",
                        borderRadius: 999,
                        backgroundColor: color,
                      }}
                    />
                  </View>
                  <Text style={{ width: 40, textAlign: "right", fontFamily: FONT.display, fontSize: 13, color: p.ink }}>
                    {c.presentToday}/{c.studentCount}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <SectionTitle>{t("admin.bo.schoolDashboard.absenteeism")}</SectionTitle>
      {absenteeism.isLoading ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : students.length === 0 ? (
        <Card>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
            {t("admin.bo.schoolDashboard.absenteeismEmpty")}
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {students.map((s) => (
            <Card key={s.userId} pad={14} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <EmpAvatar
                name={s.name}
                initials={s.name
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join("")}
                size={40}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>
                  {s.name}
                </Text>
                <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
                  {s.team ?? t("admin.bo.schoolDashboard.unassigned")}
                  {s.lastAbsenceDate
                    ? ` · ${t("admin.bo.schoolDashboard.lastAbsence", {
                        date: format(new Date(s.lastAbsenceDate), "d MMM", { locale }),
                      })}`
                    : ""}
                </Text>
              </View>
              <Pill tone="danger">{t("admin.bo.schoolDashboard.absenceCount", { n: s.absenceCount })}</Pill>
            </Card>
          ))}
        </View>
      )}
    </AdminScrollBody>
  );
}
