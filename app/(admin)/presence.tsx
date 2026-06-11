import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import type { AdminEmployee } from "~/api/admin";
import { initialsOf, shortTime } from "~/components/admin/format";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  DataRow,
  FilterChips,
  Pill,
  SearchBar,
} from "~/components/admin/primitives";
import { FONT, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAdminOverview, useEmployees } from "~/hooks/useAdminData";

// Statut best-effort dérivé de l'état du compte.
// TODO(api): endpoint de présence temps réel par employé (pointage du jour) —
// aujourd'hui le backend n'expose que des agrégats par date (analytics/presence).
type LiveState = "present" | "pending" | "absent";

function liveStateOf(e: AdminEmployee): LiveState {
  if (e.isPending) return "pending";
  return e.isActive ? "present" : "absent";
}

export default function PresenceScreen() {
  const p = useAdminTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | LiveState>("all");
  const overview = useAdminOverview();
  const query = useEmployees(search);

  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((pg) => pg.data ?? pg.items ?? []),
    [query.data],
  );

  const counts = useMemo(() => {
    const c = { all: items.length, present: 0, pending: 0, absent: 0 };
    items.forEach((e) => {
      c[liveStateOf(e)] += 1;
    });
    return c;
  }, [items]);

  const filtered = items.filter((e) => filter === "all" || liveStateOf(e) === filter);

  const o = overview.data;
  const strip: [string, number, string][] = [
    ["Présents", o?.activeEmployees ?? counts.present, p.success],
    ["Retards", o?.lateArrivals ?? 0, p.warning],
    ["En attente", counts.pending, p.primary],
    ["Absents", Math.max(0, (o?.totalEmployees ?? counts.all) - (o?.activeEmployees ?? counts.present)), p.muted2],
  ];

  const chips = [
    { key: "all", label: "Tous", count: counts.all },
    { key: "present", label: "Présents", count: counts.present, dot: p.success },
    { key: "pending", label: "En attente", count: counts.pending, dot: p.primary },
    { key: "absent", label: "Absents", count: counts.absent, dot: p.muted2 },
  ];

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader
        sub="En direct"
        title="Présence"
        right={
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              paddingHorizontal: 13,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: withAlpha(p.success, 0.14),
            }}
          >
            <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: p.success }} />
            <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: p.success }}>{shortTime()}</Text>
          </View>
        }
      />

      {/* Bande de stats agrégées (données réelles overview) */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {strip.map(([l, v, c]) => (
          <Card key={l} pad={0} style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 8, alignItems: "center" }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 21, color: c }}>{v}</Text>
            <Text style={{ fontFamily: FONT.semibold, fontSize: 10.5, color: p.muted, marginTop: 4 }}>{l}</Text>
          </Card>
        ))}
      </View>

      <SearchBar placeholder="Rechercher un employé…" value={search} onChange={setSearch} />
      <FilterChips options={chips} value={filter} onChange={(k) => setFilter(k as typeof filter)} />

      {query.isLoading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((e) => {
            const st = liveStateOf(e);
            return (
              <DataRow
                key={e.id}
                emp={{
                  first: e.firstName,
                  last: e.lastName,
                  initials: initialsOf(e.firstName, e.lastName),
                  role: e.position ?? e.role,
                  dept: e.department ?? "—",
                  status: st === "present" ? "present" : st === "pending" ? "remote" : "absent",
                }}
                right={
                  <Pill tone={st === "present" ? "success" : st === "pending" ? "primary" : "neutral"}>
                    {st === "present" ? "Présent" : st === "pending" ? "En attente" : "Absent"}
                  </Pill>
                }
              />
            );
          })}
          {filtered.length === 0 ? (
            <Text
              style={{
                textAlign: "center",
                paddingVertical: 30,
                fontFamily: FONT.body,
                fontSize: 13.5,
                color: p.muted2,
              }}
            >
              Aucun employé dans ce filtre.
            </Text>
          ) : null}
        </View>
      )}
    </AdminScrollBody>
  );
}
