import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { humanizeApiError } from "~/api/client";
import { feedback } from "~/components/feedback";
import { AdminIcon } from "~/components/admin/AdminIcon";
import { AdminHeader, AdminScrollBody, Card } from "~/components/admin/primitives";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useDefaultSchedule, useUpdateDefaultSchedule } from "~/hooks/useAdminData";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Horaire par défaut de l'instance : en mode école c'est LE seul horaire —
// il fixe la limite d'arrivée (début + tolérance) et la fin des cours pour
// tous les étudiants. Persisté côté backend (config des règles de pointage).
export default function DefaultScheduleScreen() {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const schedule = useDefaultSchedule();
  const update = useUpdateDefaultSchedule();

  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [tolerance, setTolerance] = useState("30");

  useEffect(() => {
    if (schedule.data) {
      setStartTime(schedule.data.startTime);
      setEndTime(schedule.data.endTime);
      setTolerance(String(schedule.data.lateToleranceMinutes));
    }
  }, [schedule.data]);

  const submit = () => {
    const toleranceN = Number(tolerance);
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      feedback.error(t("admin.bo.defaultSchedule.invalidTitle"), t("admin.bo.defaultSchedule.invalidTime"));
      return;
    }
    if (endTime <= startTime) {
      feedback.error(t("admin.bo.defaultSchedule.invalidTitle"), t("admin.bo.defaultSchedule.endBeforeStart"));
      return;
    }
    if (!Number.isInteger(toleranceN) || toleranceN < 0 || toleranceN > 240) {
      feedback.error(t("admin.bo.defaultSchedule.invalidTitle"), t("admin.bo.defaultSchedule.invalidTolerance"));
      return;
    }
    update.mutate(
      { startTime, endTime, lateToleranceMinutes: toleranceN },
      {
        onSuccess: () => feedback.success(t("admin.bo.defaultSchedule.savedTitle"), `${startTime} – ${endTime}`),
        onError: (e: any) => feedback.error(t("admin.bo.defaultSchedule.saveFailed"), humanizeApiError(e)),
      },
    );
  };

  const field = (label: string, hint: string, value: string, setter: (v: string) => void, placeholder: string) => (
    <View>
      <Text
        style={{
          fontFamily: FONT.bold,
          fontSize: 11.5,
          color: p.muted,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor={p.muted2}
        keyboardType="numbers-and-punctuation"
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
      <Text style={{ marginTop: 6, fontFamily: FONT.body, fontSize: 11.5, color: p.muted2 }}>{hint}</Text>
    </View>
  );

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader
        backLabel={t("admin.bo.nav.more")}
        sub={t("admin.bo.defaultSchedule.sub")}
        title={t("admin.bo.defaultSchedule.title")}
      />

      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: withAlpha(p.primary, 0.12),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AdminIcon name="clock" size={20} color={p.primary} />
          </View>
          <Text style={{ flex: 1, fontFamily: FONT.body, fontSize: 12.5, color: p.muted, lineHeight: 18 }}>
            {t("admin.bo.defaultSchedule.description")}
          </Text>
        </View>

        {schedule.isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={p.primary} />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {field(
              t("admin.bo.defaultSchedule.startTime"),
              t("admin.bo.defaultSchedule.startTimeHint"),
              startTime,
              setStartTime,
              "08:00",
            )}
            {field(
              t("admin.bo.defaultSchedule.tolerance"),
              t("admin.bo.defaultSchedule.toleranceHint"),
              tolerance,
              setTolerance,
              "30",
            )}
            {field(
              t("admin.bo.defaultSchedule.endTime"),
              t("admin.bo.defaultSchedule.endTimeHint"),
              endTime,
              setEndTime,
              "18:00",
            )}

            <Pressable
              onPress={update.isPending ? undefined : submit}
              style={{
                marginTop: 4,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 14,
                borderRadius: RADIUS.base,
                backgroundColor: p.primary,
                opacity: update.isPending ? 0.6 : 1,
              }}
            >
              {update.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <AdminIcon name="check" size={17} color="#fff" />
              )}
              <Text style={{ fontFamily: FONT.bold, fontSize: 14.5, color: "#fff" }}>{t("common.save")}</Text>
            </Pressable>
          </View>
        )}
      </Card>
    </AdminScrollBody>
  );
}
