import * as Print from "expo-print";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { exportReport, type ReportExport } from "~/api/admin";
import i18n from "~/i18n";
import { AdminIcon } from "~/components/admin/AdminIcon";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  MetricCard,
  Pill,
  SectionTitle,
  Segmented,
} from "~/components/admin/primitives";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAdminDepartments, useAdminOverview, useAdminReports } from "~/hooks/useAdminData";

const PERIOD_DAYS: Record<string, number> = { week: 7, month: 30, quarter: 90 };

// Icône par type de rapport ; le nom/desc sont traduits au rendu, les chiffres viennent du backend.
const REPORT_ICON: Record<string, string> = {
  attendance: "checkCircle",
  hours: "clockSmall",
  incidents: "bell",
  leaves: "calendar",
};

function reportHtml(r: ReportExport): string {
  const head = r.columns.map((c) => `<th>${c}</th>`).join("");
  const body = r.rows
    .map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");
  return `<html><head><meta charset="utf-8"/><style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;padding:24px;color:#0E1326}
    h1{font-size:20px;margin:0 0 4px}p{color:#6B7280;margin:0 0 18px;font-size:12px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{text-align:left;background:#2F5BFF;color:#fff;padding:8px 10px}
    td{padding:7px 10px;border-bottom:1px solid #E5E7EB}
    tr:nth-child(even) td{background:#F7F8FA}
  </style></head><body>
    <h1>${r.title}</h1><p>${i18n.t("admin.bo.reports.htmlSubtitle", { n: r.rows.length })}</p>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  </body></html>`;
}

export default function ReportsScreen() {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const [period, setPeriod] = useState("month");
  const [busy, setBusy] = useState<string | null>(null);
  const days = PERIOD_DAYS[period] ?? 30;

  const overview = useAdminOverview(days);
  const departments = useAdminDepartments(days);
  const reports = useAdminReports(days);

  const o = overview.data;
  const depts = departments.data ?? [];
  const maxDept = Math.max(1, ...depts.map((d) => d.headcount));

  const onExport = async (type: string, fmt: "CSV" | "PDF") => {
    setBusy(`${type}:${fmt}`);
    try {
      const r = await exportReport(type, days);
      if (r.rows.length === 0) {
        Toast.show({ type: "info", text1: r.title, text2: t("admin.bo.reports.noData") });
        return;
      }
      if (fmt === "CSV") {
        await Share.share({ message: r.csv, title: r.filename });
      } else {
        await Print.printAsync({ html: reportHtml(r) });
      }
    } catch {
      Toast.show({ type: "error", text1: t("admin.bo.reports.exportFailed"), text2: t("admin.bo.reports.exportFailedMsg") });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader backLabel={t("admin.bo.nav.more")} sub={t("admin.bo.reports.sub")} title={t("admin.bo.reports.title")} />
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
        <MetricCard
          label={t("admin.bo.reports.hours")}
          value={o ? Math.round(o.totalHours).toLocaleString(i18n.language?.startsWith("en") ? "en-US" : "fr-FR") : "—"}
          unit="h"
          foot={<Pill tone="primary">{o ? t("admin.bo.reports.hoursPerDay", { n: o.avgHoursPerDay }) : "—"}</Pill>}
        />
        <MetricCard
          label={t("admin.bo.reports.attendance")}
          value={o ? `${o.attendanceRate}` : "—"}
          unit="%"
          foot={<Pill tone={o && o.attendanceRate >= 90 ? "success" : "warning"}>{t("admin.bo.reports.goal")}</Pill>}
        />
        <MetricCard
          label={t("admin.bo.reports.late")}
          value={o ? `${o.lateArrivals}` : "—"}
          foot={<Pill tone="accent">{o ? t("admin.bo.reports.punct", { n: o.punctualityRate }) : "—"}</Pill>}
        />
      </View>

      <Card>
        <SectionTitle>{t("admin.bo.reports.byDept")}</SectionTitle>
        {departments.isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={p.primary} />
          </View>
        ) : depts.length === 0 ? (
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted, marginTop: 12 }}>
            {t("admin.bo.reports.noPresence")}
          </Text>
        ) : (
          <View style={{ gap: 12, marginTop: 14 }}>
            {depts.map((d) => {
              const pct = d.headcount > 0 ? Math.round((d.present / d.headcount) * 100) : 0;
              const color = pct >= 90 ? p.success : pct >= 75 ? p.primary : p.warning;
              return (
                <View key={d.department} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text numberOfLines={1} style={{ width: 76, fontFamily: FONT.semibold, fontSize: 12.5, color: p.ink }}>
                    {d.department}
                  </Text>
                  <View style={{ flex: 1, height: 9, borderRadius: 999, backgroundColor: p.line, overflow: "hidden" }}>
                    <View
                      style={{
                        width: `${(d.present / maxDept) * 100}%`,
                        height: "100%",
                        borderRadius: 999,
                        backgroundColor: color,
                      }}
                    />
                  </View>
                  <Text style={{ width: 40, textAlign: "right", fontFamily: FONT.display, fontSize: 13, color: p.ink }}>
                    {d.present}/{d.headcount}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <SectionTitle>{t("admin.bo.reports.available")}</SectionTitle>
      <View style={{ gap: 10 }}>
        {(reports.data ?? []).map((r) => {
          const icon = REPORT_ICON[r.type] ?? "doc";
          const metaName = REPORT_ICON[r.type] ? t(`admin.bo.reports.${r.type}Name`) : r.type;
          const metaDesc = REPORT_ICON[r.type] ? t(`admin.bo.reports.${r.type}Desc`) : "";
          return (
            <Card key={r.type} pad={15} style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: withAlpha(p.primary, 0.12),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AdminIcon name={icon} size={20} color={p.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: FONT.bold, fontSize: 14.5, color: p.ink }}>{metaName}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
                    {metaDesc}
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT.bold, fontSize: 11, color: p.muted2 }}>{t("admin.bo.reports.rows", { n: r.rows })}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["CSV", "PDF"] as const).map((fmt) => {
                  const isBusy = busy === `${r.type}:${fmt}`;
                  return (
                    <Pressable
                      key={fmt}
                      onPress={() => onExport(r.type, fmt)}
                      disabled={busy != null}
                      android_ripple={{ color: withAlpha(p.primary, 0.08) }}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        borderWidth: 1,
                        borderColor: p.line,
                        backgroundColor: p.surface2,
                        borderRadius: RADIUS.sm,
                        paddingVertical: 10,
                        opacity: busy != null && !isBusy ? 0.5 : 1,
                      }}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={p.primary} />
                      ) : (
                        <>
                          <AdminIcon name="download" size={15} color={p.primary} />
                          <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: p.ink }}>{fmt}</Text>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </View>
    </AdminScrollBody>
  );
}
