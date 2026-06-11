import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import type { PlanningEvent } from "~/api/admin";
import { AdminIcon } from "~/components/admin/AdminIcon";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  EmpAvatar,
  IconBtn,
  SectionTitle,
} from "~/components/admin/primitives";
import { FONT, toneColor, withAlpha, type Tone } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAdminPlanning } from "~/hooks/useAdminData";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const soon = () => Toast.show({ type: "info", text1: "Nouvelle demande", text2: "Bientôt disponible." });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function PlanningScreen() {
  const p = useAdminTheme();
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const planning = useAdminPlanning(ym.year, ym.month);

  const events = planning.data?.events ?? [];
  const daysInMonth =
    planning.data?.daysInMonth ?? new Date(ym.year, ym.month, 0).getDate();

  const first = new Date(ym.year, ym.month - 1, 1);
  const startWd = (first.getDay() + 6) % 7;
  const monthName = first.toLocaleDateString("fr-FR", { month: "long" });
  const label = cap(first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }));
  const isCurrent = now.getFullYear() === ym.year && now.getMonth() + 1 === ym.month;
  const todayD = isCurrent ? now.getDate() : -1;

  const byDay: Record<number, Tone[]> = {};
  events.forEach((e) => {
    for (let d = e.start; d <= e.end; d++) (byDay[d] = byDay[d] ?? []).push(e.tone as Tone);
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const offToday = (byDay[todayD] ?? []).length;
  const fmtRange = (e: PlanningEvent) =>
    e.start === e.end ? `${e.start} ${monthName}` : `${e.start} – ${e.end} ${monthName}`;

  const shift = (dir: number) =>
    setYm((c) => {
      const idx = c.month - 1 + dir;
      return { year: c.year + Math.floor(idx / 12), month: ((idx % 12) + 12) % 12 + 1 };
    });

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader
        sub="Congés & absences"
        title="Planning"
        right={<IconBtn icon="plus" tone="primary" onPress={soon} />}
      />

      {/* Navigation de mois */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <MonthNav icon="chevronLeft" onPress={() => shift(-1)} />
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: p.ink }}>{label}</Text>
        <MonthNav icon="chevron" onPress={() => shift(1)} />
      </View>

      {planning.isLoading ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : (
        <>
          {/* Calendrier */}
          <Card pad={15}>
            <View style={{ flexDirection: "row", gap: 4, marginBottom: 8 }}>
              {WEEKDAYS.map((d, i) => (
                <Text
                  key={i}
                  style={{ flex: 1, textAlign: "center", fontFamily: FONT.bold, fontSize: 11, color: p.muted2 }}
                >
                  {d}
                </Text>
              ))}
            </View>
            <View style={{ gap: 4 }}>
              {weeks.map((week, wi) => (
                <View key={wi} style={{ flexDirection: "row", gap: 4 }}>
                  {week.map((d, di) => {
                    const weekend = di >= 5;
                    const tones = d ? byDay[d] ?? [] : [];
                    const isToday = d != null && d === todayD;
                    return (
                      <View
                        key={di}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          borderRadius: 11,
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 3,
                          backgroundColor: isToday ? p.primary : weekend ? "transparent" : p.surface2,
                          borderWidth: isToday || !d ? 0 : 1,
                          borderColor: p.line,
                        }}
                      >
                        {d ? (
                          <Text
                            style={{
                              fontFamily: isToday || tones.length ? FONT.bold : FONT.body,
                              fontSize: 12.5,
                              color: isToday ? "#fff" : weekend ? p.muted2 : p.ink,
                            }}
                          >
                            {d}
                          </Text>
                        ) : null}
                        {tones.length > 0 ? (
                          <View style={{ flexDirection: "row", gap: 2.5, alignItems: "center" }}>
                            {tones.slice(0, 3).map((tn, k) => (
                              <View
                                key={k}
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: 999,
                                  backgroundColor: isToday ? "rgba(255,255,255,0.9)" : toneColor(p, tn),
                                }}
                              />
                            ))}
                            {tones.length > 3 ? (
                              <Text style={{ fontFamily: FONT.bold, fontSize: 8, color: isToday ? "#fff" : p.muted2 }}>
                                +
                              </Text>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Légende */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 14,
                paddingTop: 13,
                borderTopWidth: 1,
                borderTopColor: p.line,
              }}
            >
              {([["Congés", "accent"], ["RTT / Télétravail", "primary"], ["Absence", "warning"]] as [string, Tone][]).map(
                ([l, tn]) => (
                  <View key={l} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: toneColor(p, tn) }} />
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 11.5, color: p.muted }}>{l}</Text>
                  </View>
                ),
              )}
            </View>
          </Card>

          {/* Résumé du jour */}
          <Card soft pad={14} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
              <AdminIcon name="calendar" size={20} color={p.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>
                {offToday > 0
                  ? `${offToday} personne${offToday > 1 ? "s" : ""} absente${offToday > 1 ? "s" : ""} aujourd'hui`
                  : "Effectif complet aujourd'hui"}
              </Text>
              <Text style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
                {events.length} congés & absences ce mois-ci
              </Text>
            </View>
          </Card>

          <SectionTitle>À venir</SectionTitle>
          {events.length === 0 ? (
            <Card soft style={{ alignItems: "center", paddingVertical: 22 }}>
              <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
                Aucun congé ni absence ce mois-ci.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: 9 }}>
              {[...events]
                .sort((a, b) => a.start - b.start)
                .map((e, i) => (
                  <Card key={i} pad={13} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <EmpAvatar name={e.emp} initials={e.initials} size={40} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>
                        {e.emp}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
                        <AdminIcon name="calendar" size={12} color={p.muted} />
                        <Text style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>{fmtRange(e)}</Text>
                      </View>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 11,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: withAlpha(toneColor(p, e.tone as Tone), 0.13),
                      }}
                    >
                      <Text style={{ fontFamily: FONT.bold, fontSize: 11.5, color: toneColor(p, e.tone as Tone) }}>
                        {e.type}
                      </Text>
                    </View>
                  </Card>
                ))}
            </View>
          )}
        </>
      )}
    </AdminScrollBody>
  );
}

function MonthNav({ icon, onPress }: { icon: string; onPress: () => void }) {
  const p = useAdminTheme();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: withAlpha(p.primary, 0.08), borderless: true }}
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: p.line,
        backgroundColor: p.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AdminIcon name={icon} size={18} color={p.muted} />
    </Pressable>
  );
}
