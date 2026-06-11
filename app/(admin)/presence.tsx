import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import type { LivePresenceEntry, LivePresenceState } from "~/api/admin";
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
import { FONT, withAlpha, type PresenceStatus, type Tone } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useLivePresence } from "~/hooks/useAdminData";

// Statut du jour réel renvoyé par /admin/presence → métadonnées d'affichage.
const STATE_META: Record<
  LivePresenceState,
  { label: string; tone: Tone; status: PresenceStatus }
> = {
  present: { label: "Présent", tone: "success", status: "present" },
  late: { label: "En retard", tone: "warning", status: "late" },
  out: { label: "Parti", tone: "primary", status: "present" },
  leave: { label: "En congé", tone: "accent", status: "leave" },
  absent: { label: "Absent", tone: "danger", status: "absent" },
  pending: { label: "Non pointé", tone: "neutral", status: "absent" },
};

type Filter = "all" | "present" | "late" | "leave" | "absent";

function inFilter(st: LivePresenceState, f: Filter): boolean {
  switch (f) {
    case "all":
      return true;
    case "present":
      return st === "present" || st === "late" || st === "out";
    case "late":
      return st === "late";
    case "leave":
      return st === "leave";
    case "absent":
      return st === "absent" || st === "pending";
  }
}

export default function PresenceScreen() {
  const p = useAdminTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const query = useLivePresence();

  const items = useMemo(() => query.data ?? [], [query.data]);

  const counts = useMemo(() => {
    const c = { all: items.length, present: 0, late: 0, leave: 0, absent: 0 };
    items.forEach((e) => {
      if (e.state === "present" || e.state === "late" || e.state === "out") c.present += 1;
      if (e.state === "late") c.late += 1;
      if (e.state === "leave") c.leave += 1;
      if (e.state === "absent" || e.state === "pending") c.absent += 1;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((e) => {
      if (!inFilter(e.state, filter)) return false;
      if (!q) return true;
      return `${e.firstName} ${e.lastName} ${e.position ?? ""} ${e.department ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [items, filter, search]);

  const strip: [string, number, string][] = [
    ["Présents", counts.present, p.success],
    ["Retards", counts.late, p.warning],
    ["Congé", counts.leave, p.accent],
    ["Absents", counts.absent, p.muted2],
  ];

  const chips = [
    { key: "all", label: "Tous", count: counts.all },
    { key: "present", label: "Présents", count: counts.present, dot: p.success },
    { key: "late", label: "Retards", count: counts.late, dot: p.warning },
    { key: "leave", label: "Congé", count: counts.leave, dot: p.accent },
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

      {/* Bande de stats (statut du jour réel) */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {strip.map(([l, v, c]) => (
          <Card key={l} pad={0} style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 8, alignItems: "center" }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 21, color: c }}>{v}</Text>
            <Text style={{ fontFamily: FONT.semibold, fontSize: 10.5, color: p.muted, marginTop: 4 }}>{l}</Text>
          </Card>
        ))}
      </View>

      <SearchBar placeholder="Rechercher un employé…" value={search} onChange={setSearch} />
      <FilterChips options={chips} value={filter} onChange={(k) => setFilter(k as Filter)} />

      {query.isLoading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((e) => (
            <PresenceRow key={e.id} e={e} />
          ))}
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

function PresenceRow({ e }: { e: LivePresenceEntry }) {
  const p = useAdminTheme();
  const meta = STATE_META[e.state];
  const since = e.since ? shortTime(new Date(e.since)) : null;
  return (
    <DataRow
      emp={{
        first: e.firstName,
        last: e.lastName,
        initials: initialsOf(e.firstName, e.lastName),
        role: e.position ?? e.role,
        dept: e.department ?? "—",
        status: meta.status,
      }}
      right={
        <View style={{ alignItems: "flex-end", gap: 3 }}>
          <Pill tone={meta.tone}>{meta.label}</Pill>
          {since ? (
            <Text style={{ fontFamily: FONT.semibold, fontSize: 10.5, color: p.muted2 }}>{since}</Text>
          ) : null}
        </View>
      }
    />
  );
}
