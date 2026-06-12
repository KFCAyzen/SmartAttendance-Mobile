import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";

import type { AdminEmployee, PlanningEvent } from "~/api/admin";
import type { LeaveType } from "~/api/leaves";
import { AdminIcon } from "~/components/admin/AdminIcon";
import { initialsOf } from "~/components/admin/format";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  EmpAvatar,
  IconBtn,
  SearchBar,
  SectionTitle,
} from "~/components/admin/primitives";
import { Sheet } from "~/components/admin/Sheet";
import { FONT, RADIUS, toneColor, withAlpha, type Tone } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAdminPlanning, useCreateLeave, useEmployees } from "~/hooks/useAdminData";

const LEAVE_TYPE_KEYS: LeaveType[] = ["VACATION", "SICK", "PERSONAL", "UNPAID", "MATERNITY", "PATERNITY"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Code locale Intl courant. */
const localeOf = (lng?: string) => (lng?.startsWith("en") ? "en-US" : "fr-FR");

/** Lettres des jours, lundi → dimanche, selon la langue. */
function weekdayLetters(lng?: string): string[] {
  const fmt = new Intl.DateTimeFormat(localeOf(lng), { weekday: "narrow" });
  // 2024-01-01 est un lundi → on couvre lundi..dimanche.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
}

export default function PlanningScreen() {
  const p = useAdminTheme();
  const { t, i18n } = useTranslation();
  const locale = localeOf(i18n.language);
  const WEEKDAYS = useMemo(() => weekdayLetters(i18n.language), [i18n.language]);
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [addOpen, setAddOpen] = useState(false);
  const planning = useAdminPlanning(ym.year, ym.month);

  const events = planning.data?.events ?? [];
  const daysInMonth =
    planning.data?.daysInMonth ?? new Date(ym.year, ym.month, 0).getDate();

  const first = new Date(ym.year, ym.month - 1, 1);
  const startWd = (first.getDay() + 6) % 7;
  const monthName = first.toLocaleDateString(locale, { month: "long" });
  const label = cap(first.toLocaleDateString(locale, { month: "long", year: "numeric" }));
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
    <>
    <AdminScrollBody gap={12}>
      <AdminHeader
        backLabel={t("admin.bo.nav.more")}
        sub={t("admin.bo.planning.sub")}
        title={t("admin.bo.planning.title")}
        right={<IconBtn icon="plus" tone="primary" onPress={() => setAddOpen(true)} />}
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
              {([[t("admin.bo.planning.legendLeave"), "accent"], [t("admin.bo.planning.legendRtt"), "primary"], [t("admin.bo.planning.legendAbsence"), "warning"]] as [string, Tone][]).map(
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
                  ? t("admin.bo.planning.absentToday", { count: offToday })
                  : t("admin.bo.planning.fullToday")}
              </Text>
              <Text style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
                {t("admin.bo.planning.monthSummary", { count: events.length })}
              </Text>
            </View>
          </Card>

          <SectionTitle>{t("admin.bo.planning.upcoming")}</SectionTitle>
          {events.length === 0 ? (
            <Card soft style={{ alignItems: "center", paddingVertical: 22 }}>
              <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
                {t("admin.bo.planning.noEvents")}
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

    <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
      <AddLeaveForm onDone={() => setAddOpen(false)} />
    </Sheet>
    </>
  );
}

function AddLeaveForm({ onDone }: { onDone: () => void }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const create = useCreateLeave();
  const [search, setSearch] = useState("");
  const [emp, setEmp] = useState<AdminEmployee | null>(null);
  const [type, setType] = useState<LeaveType>("VACATION");
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);

  const query = useEmployees(search);
  const employees = useMemo(
    () => (query.data?.pages ?? []).flatMap((pg) => pg.data ?? pg.items ?? []),
    [query.data],
  );

  const isoOk = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());

  const submit = () => {
    if (!emp) {
      Toast.show({ type: "error", text1: t("admin.bo.planning.empRequired"), text2: t("admin.bo.planning.empRequiredMsg") });
      return;
    }
    if (!isoOk(start) || !isoOk(end)) {
      Toast.show({ type: "error", text1: t("admin.bo.planning.datesInvalid"), text2: t("admin.bo.planning.datesInvalidMsg") });
      return;
    }
    if (new Date(end) < new Date(start)) {
      Toast.show({ type: "error", text1: t("admin.bo.planning.datesOrder"), text2: t("admin.bo.planning.datesOrderMsg") });
      return;
    }
    create.mutate(
      { userId: emp.id, type, startDate: start, endDate: end },
      {
        onSuccess: () => {
          onDone();
          Toast.show({ type: "success", text1: t("admin.bo.planning.scheduled"), text2: `${emp.firstName} ${emp.lastName}` });
        },
        onError: (e: any) =>
          Toast.show({
            type: "error",
            text1: t("admin.bo.common.failed"),
            text2: e?.response?.data?.message ?? t("admin.bo.common.tryAgain"),
          }),
      },
    );
  };

  const label = (s: string) => (
    <Text
      style={{
        fontFamily: FONT.bold,
        fontSize: 11.5,
        color: p.muted,
        letterSpacing: 0.3,
        textTransform: "uppercase",
      }}
    >
      {s}
    </Text>
  );

  const dateInput = (value: string, setter: (v: string) => void) => (
    <View style={{ flex: 1 }}>
      <TextInput
        value={value}
        onChangeText={setter}
        placeholder={t("admin.bo.planning.datePlaceholder")}
        placeholderTextColor={p.muted2}
        autoCapitalize="none"
        style={{
          marginTop: 8,
          paddingVertical: 13,
          paddingHorizontal: 14,
          borderRadius: RADIUS.base,
          backgroundColor: p.surface2,
          borderWidth: 1,
          borderColor: p.line,
          fontFamily: FONT.medium,
          fontSize: 14,
          color: p.ink,
        }}
      />
    </View>
  );

  return (
    <View style={{ gap: 15 }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>{t("admin.bo.planning.scheduleLeave")}</Text>

      {emp ? (
        <Pressable
          onPress={() => setEmp(null)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: withAlpha(p.primary, 0.1),
            borderRadius: RADIUS.base,
            padding: 11,
            paddingHorizontal: 13,
          }}
        >
          <EmpAvatar name={`${emp.firstName} ${emp.lastName}`} initials={initialsOf(emp.firstName, emp.lastName)} size={38} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>
              {emp.firstName} {emp.lastName}
            </Text>
            <Text style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>{t("admin.bo.planning.changeEmployee")}</Text>
          </View>
          <AdminIcon name="xmark" size={16} color={p.muted2} />
        </Pressable>
      ) : (
        <View style={{ gap: 9 }}>
          {label(t("admin.bo.planning.employee"))}
          <SearchBar placeholder={t("admin.bo.planning.searchEmployee")} value={search} onChange={setSearch} />
          <View style={{ gap: 6, maxHeight: 220 }}>
            {employees.slice(0, 8).map((e) => (
              <Pressable
                key={e.id}
                onPress={() => setEmp(e)}
                android_ripple={{ color: withAlpha(p.primary, 0.08) }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 11,
                  paddingVertical: 9,
                  paddingHorizontal: 11,
                  borderRadius: RADIUS.base,
                  backgroundColor: p.surface2,
                  borderWidth: 1,
                  borderColor: p.line,
                }}
              >
                <EmpAvatar name={`${e.firstName} ${e.lastName}`} initials={initialsOf(e.firstName, e.lastName)} size={34} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: FONT.semibold, fontSize: 13.5, color: p.ink }}>
                    {e.firstName} {e.lastName}
                  </Text>
                  <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 11.5, color: p.muted }}>
                    {e.position ?? e.department ?? "—"}
                  </Text>
                </View>
              </Pressable>
            ))}
            {query.isLoading ? <ActivityIndicator color={p.primary} /> : null}
          </View>
        </View>
      )}

      <View>
        {label(t("admin.bo.planning.type"))}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
          {LEAVE_TYPE_KEYS.map((k) => {
            const on = type === k;
            return (
              <Pressable
                key={k}
                onPress={() => setType(k)}
                style={{
                  borderWidth: 1,
                  borderColor: on ? p.primary : p.line,
                  backgroundColor: on ? withAlpha(p.primary, 0.12) : p.surface2,
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: on ? p.primary : p.muted }}>{t(`leaveTypes.${k}`)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          {label(t("admin.bo.planning.start"))}
          {dateInput(start, setStart)}
        </View>
        <View style={{ flex: 1 }}>
          {label(t("admin.bo.planning.end"))}
          {dateInput(end, setEnd)}
        </View>
      </View>

      <Pressable
        onPress={create.isPending ? undefined : submit}
        style={{
          backgroundColor: p.primary,
          borderRadius: RADIUS.base,
          paddingVertical: 16,
          alignItems: "center",
          opacity: create.isPending ? 0.7 : 1,
        }}
      >
        {create.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: "#fff" }}>{t("admin.bo.planning.schedule")}</Text>
        )}
      </Pressable>
    </View>
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
