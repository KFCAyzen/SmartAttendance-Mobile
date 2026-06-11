import * as Print from "expo-print";
import { useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { exportReport, type ReportExport } from "~/api/admin";
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

// Métadonnées présentationnelles ; les chiffres viennent du backend.
const REPORT_META: Record<string, { name: string; desc: string; icon: string }> = {
  attendance: { name: "Assiduité", desc: "Présence & ponctualité par employé", icon: "checkCircle" },
  hours: { name: "Heures travaillées", desc: "Temps de travail et moyennes", icon: "clockSmall" },
  incidents: { name: "Retards & absences", desc: "Incidents de pointage et motifs", icon: "bell" },
  leaves: { name: "Congés & RTT", desc: "Demandes, dates et statuts", icon: "calendar" },
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
    <h1>${r.title}</h1><p>${r.rows.length} lignes · export SmartAttendance</p>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  </body></html>`;
}

export default function ReportsScreen() {
  const p = useAdminTheme();
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
        Toast.show({ type: "info", text1: r.title, text2: "Aucune donnée sur la période." });
        return;
      }
      if (fmt === "CSV") {
        await Share.share({ message: r.csv, title: r.filename });
      } else {
        await Print.printAsync({ html: reportHtml(r) });
      }
    } catch {
      Toast.show({ type: "error", text1: "Export impossible", text2: "Réessayez plus tard." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader sub="Exports & analyses" title="Rapports" />
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { key: "week", label: "Semaine" },
          { key: "month", label: "Mois" },
          { key: "quarter", label: "Trimestre" },
        ]}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <MetricCard
          label="Heures"
          value={o ? Math.round(o.totalHours).toLocaleString("fr-FR") : "—"}
          unit="h"
          foot={<Pill tone="primary">{o ? `${o.avgHoursPerDay} h/j` : "—"}</Pill>}
        />
        <MetricCard
          label="Assiduité"
          value={o ? `${o.attendanceRate}` : "—"}
          unit="%"
          foot={<Pill tone={o && o.attendanceRate >= 90 ? "success" : "warning"}>objectif 90%</Pill>}
        />
        <MetricCard
          label="Retards"
          value={o ? `${o.lateArrivals}` : "—"}
          foot={<Pill tone="accent">{o ? `${o.punctualityRate}% ponct.` : "—"}</Pill>}
        />
      </View>

      <Card>
        <SectionTitle>Présence par département</SectionTitle>
        {departments.isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={p.primary} />
          </View>
        ) : depts.length === 0 ? (
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted, marginTop: 12 }}>
            Aucune donnée de présence.
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

      <SectionTitle>Rapports disponibles</SectionTitle>
      <View style={{ gap: 10 }}>
        {(reports.data ?? []).map((r) => {
          const meta = REPORT_META[r.type] ?? { name: r.type, desc: "", icon: "doc" };
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
                  <AdminIcon name={meta.icon} size={20} color={p.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: FONT.bold, fontSize: 14.5, color: p.ink }}>{meta.name}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
                    {meta.desc}
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT.bold, fontSize: 11, color: p.muted2 }}>{r.rows} lignes</Text>
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
