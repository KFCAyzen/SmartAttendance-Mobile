import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
// `labelKey` pointe vers admin.bo.status.* (traduit au rendu).
const STATE_META: Record<
  LivePresenceState,
  { labelKey: string; tone: Tone; status: PresenceStatus }
> = {
  present: { labelKey: "present", tone: "success", status: "present" },
  late: { labelKey: "late", tone: "warning", status: "late" },
  out: { labelKey: "out", tone: "primary", status: "present" },
  leave: { labelKey: "leave", tone: "accent", status: "leave" },
  absent: { labelKey: "absent", tone: "danger", status: "absent" },
  pending: { labelKey: "pending", tone: "neutral", status: "absent" },
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
  const { t } = useTranslation();
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
    [t("admin.bo.presence.present"), counts.present, p.success],
    [t("admin.bo.presence.late"), counts.late, p.warning],
    [t("admin.bo.presence.leave"), counts.leave, p.accent],
    [t("admin.bo.presence.absent"), counts.absent, p.muted2],
  ];

  const chips = [
    { key: "all", label: t("admin.bo.presence.all"), count: counts.all },
    { key: "present", label: t("admin.bo.presence.present"), count: counts.present, dot: p.success },
    { key: "late", label: t("admin.bo.presence.late"), count: counts.late, dot: p.warning },
    { key: "leave", label: t("admin.bo.presence.leave"), count: counts.leave, dot: p.accent },
    { key: "absent", label: t("admin.bo.presence.absent"), count: counts.absent, dot: p.muted2 },
  ];

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader
        sub={t("admin.bo.presence.sub")}
        title={t("admin.bo.presence.title")}
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

      <SearchBar placeholder={t("admin.bo.presence.search")} value={search} onChange={setSearch} />
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
              {t("admin.bo.presence.emptyFilter")}
            </Text>
          ) : null}
        </View>
      )}
    </AdminScrollBody>
  );
}

function PresenceRow({ e }: { e: LivePresenceEntry }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
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
          <Pill tone={meta.tone}>{t(`admin.bo.status.${meta.labelKey}`)}</Pill>
          {since ? (
            <Text style={{ fontFamily: FONT.semibold, fontSize: 10.5, color: p.muted2 }}>{since}</Text>
          ) : null}
        </View>
      }
    />
  );
}
