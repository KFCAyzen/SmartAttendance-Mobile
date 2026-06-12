import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Switch, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";

import type { AdminSettings, RoleSummary } from "~/api/admin";
import { AdminIcon } from "~/components/admin/AdminIcon";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  SectionTitle,
} from "~/components/admin/primitives";
import { Sheet } from "~/components/admin/Sheet";
import { FONT, RADIUS, toneColor, toneSoft, withAlpha, type Tone } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAdminRoles, useAdminSettings, useUpdateSetting } from "~/hooks/useAdminData";
import { setLanguage } from "~/i18n";

// Champs texte/numériques de la config de pointage éditables via la feuille.
// `titleKey`/`placeholder` traduits/affichés au rendu.
type EditKey = "faceThreshold" | "workHours";
const EDITABLE: Record<EditKey, { titleKey: string; placeholder: string; numeric?: boolean }> = {
  faceThreshold: { titleKey: "editFaceTitle", placeholder: "85", numeric: true },
  workHours: { titleKey: "editWorkTitle", placeholder: "09:00 - 18:00" },
};

// Métadonnées présentationnelles du rôle ; nom/desc/perms traduits, l'effectif vient du backend.
const ROLE_META: Record<RoleSummary["role"], { descKey: string; permKeys: string[]; tone: Tone; icon: string }> = {
  ADMIN: { descKey: "adminDesc", permKeys: ["permManageAll", "permSitesDevices", "permRoles"], tone: "primary", icon: "key" },
  HR: { descKey: "hrDesc", permKeys: ["permEmployees", "permApproveLeave", "permReports"], tone: "accent", icon: "briefcase" },
  EMPLOYEE: { descKey: "employeeDesc", permKeys: ["permCheckin", "permOwnRequests"], tone: "neutral", icon: "user" },
};

export default function RolesScreen() {
  const p = useAdminTheme();
  const { t, i18n } = useTranslation();
  const roles = useAdminRoles();
  const settings = useAdminSettings();
  const updateSetting = useUpdateSetting();

  const s = settings.data;
  const roleList = roles.data ?? [];
  const isEnglish = i18n.language?.startsWith("en");

  const [editKey, setEditKey] = useState<EditKey | null>(null);
  const [draft, setDraft] = useState("");

  const toggle = (key: keyof AdminSettings, value: boolean) =>
    updateSetting.mutate(
      { key, value },
      { onError: () => Toast.show({ type: "error", text1: t("admin.bo.common.failed"), text2: t("admin.bo.roles.settingNotSaved") }) },
    );

  const openEdit = (key: EditKey) => {
    setDraft(String(s?.[key] ?? ""));
    setEditKey(key);
  };

  const saveEdit = () => {
    if (!editKey) return;
    let value = draft.trim();
    if (editKey === "faceThreshold") {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 1 || n > 100) {
        Toast.show({ type: "error", text1: t("admin.bo.roles.invalidValue"), text2: t("admin.bo.roles.thresholdRange") });
        return;
      }
      value = String(Math.round(n));
    } else if (!value) {
      Toast.show({ type: "error", text1: t("admin.bo.roles.requiredField") });
      return;
    }
    updateSetting.mutate(
      { key: editKey, value },
      {
        onSuccess: () => {
          setEditKey(null);
          Toast.show({ type: "success", text1: t("admin.bo.roles.settingSaved") });
        },
        onError: () => Toast.show({ type: "error", text1: t("admin.bo.common.failed"), text2: t("admin.bo.roles.settingNotSaved") }),
      },
    );
  };

  return (
    <>
    <AdminScrollBody gap={12}>
      <AdminHeader backLabel={t("admin.bo.nav.more")} sub={t("admin.bo.roles.sub")} title={t("admin.bo.roles.title")} />

      {roles.isLoading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {roleList.map((r) => {
            const meta = ROLE_META[r.role];
            if (!meta) return null;
            return (
              <Card key={r.role} pad={15} style={{ gap: 11 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      backgroundColor: toneSoft(p, meta.tone),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AdminIcon name={meta.icon} size={20} color={toneColor(p, meta.tone)} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: p.ink }}>{t(`admin.bo.roleLabels.${r.role}`)}</Text>
                    <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
                      {t(`admin.bo.roles.${meta.descKey}`)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: FONT.display, fontSize: 18, color: p.ink }}>{r.members}</Text>
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 10.5, color: p.muted2 }}>
                      {t("admin.bo.roles.members", { count: r.members })}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {meta.permKeys.map((permKey) => (
                    <View
                      key={permKey}
                      style={{
                        backgroundColor: p.surface2,
                        borderWidth: 1,
                        borderColor: p.line,
                        borderRadius: 999,
                        paddingHorizontal: 11,
                        paddingVertical: 5,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.semibold, fontSize: 11.5, color: p.muted }}>{t(`admin.bo.roles.${permKey}`)}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <SectionTitle>{t("admin.bo.roles.checkinSettings")}</SectionTitle>
      <Card pad={0} style={{ overflow: "hidden" }}>
        <CfgRow
          icon="face"
          label={t("admin.bo.roles.faceRecognition")}
          detail={s ? t("admin.bo.roles.threshold", { n: s.faceThreshold }) : "—"}
          onPress={s ? () => openEdit("faceThreshold") : undefined}
        />
        <CfgRow
          icon="location"
          label={t("admin.bo.roles.geofencing")}
          value={s?.geofencing ?? false}
          onToggle={(v) => toggle("geofencing", v)}
          disabled={!s}
        />
        <CfgRow
          icon="clockSmall"
          label={t("admin.bo.roles.workHours")}
          detail={s?.workHours ?? "—"}
          onPress={s ? () => openEdit("workHours") : undefined}
        />
        <CfgRow
          icon="shield"
          label={t("admin.bo.roles.strictDouble")}
          value={s?.strictDoubleCheckin ?? false}
          onToggle={(v) => toggle("strictDoubleCheckin", v)}
          disabled={!s}
        />
        <CfgRow
          icon="bell"
          label={t("admin.bo.roles.lateAlerts")}
          value={s?.lateAlerts ?? false}
          onToggle={(v) => toggle("lateAlerts", v)}
          disabled={!s}
          last
        />
      </Card>

      <SectionTitle>{t("admin.bo.roles.preferences")}</SectionTitle>
      <Card pad={0} style={{ overflow: "hidden" }}>
        <CfgRow
          icon="globe"
          label={t("admin.bo.roles.language")}
          detail={isEnglish ? "English" : "Français"}
          onPress={() => void setLanguage(isEnglish ? "fr" : "en")}
          last
        />
      </Card>
    </AdminScrollBody>

      <Sheet open={editKey != null} onClose={() => setEditKey(null)}>
        {editKey ? (
          <View style={{ gap: 15 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>
              {t(`admin.bo.roles.${EDITABLE[editKey].titleKey}`)}
            </Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={EDITABLE[editKey].placeholder}
              placeholderTextColor={p.muted2}
              keyboardType={EDITABLE[editKey].numeric ? "number-pad" : "default"}
              autoFocus
              style={{
                paddingVertical: 13,
                paddingHorizontal: 14,
                borderRadius: RADIUS.base,
                backgroundColor: p.surface2,
                borderWidth: 1,
                borderColor: p.line,
                fontFamily: FONT.medium,
                fontSize: 15,
                color: p.ink,
              }}
            />
            <Pressable
              onPress={updateSetting.isPending ? undefined : saveEdit}
              style={{
                backgroundColor: p.primary,
                borderRadius: RADIUS.base,
                paddingVertical: 16,
                alignItems: "center",
                opacity: updateSetting.isPending ? 0.7 : 1,
              }}
            >
              <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: "#fff" }}>{t("common.save")}</Text>
            </Pressable>
          </View>
        ) : null}
      </Sheet>
    </>
  );
}

function CfgRow({
  icon,
  label,
  detail,
  value,
  onToggle,
  onPress,
  disabled,
  last,
}: {
  icon: string;
  label: string;
  detail?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  disabled?: boolean;
  last?: boolean;
}) {
  const p = useAdminTheme();
  const isToggle = onToggle != null;
  const inner = (
    <>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: withAlpha(p.primary, 0.12),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AdminIcon name={icon} size={18} color={p.primary} />
      </View>
      <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: 14.5, color: p.ink }}>{label}</Text>
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: p.line, true: p.primary }}
          thumbColor="#fff"
        />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 13.5, color: p.muted }}>{detail}</Text>
          <AdminIcon name="chevron" size={16} color={p.muted2} />
        </View>
      )}
    </>
  );
  const rowStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 13,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: p.line,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: withAlpha(p.primary, 0.08) }} style={rowStyle}>
        {inner}
      </Pressable>
    );
  }
  return <View style={rowStyle}>{inner}</View>;
}
