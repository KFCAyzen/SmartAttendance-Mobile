import { ActivityIndicator, Switch, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import type { AdminSettings, RoleSummary } from "~/api/admin";
import { AdminIcon } from "~/components/admin/AdminIcon";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  IconBtn,
  SectionTitle,
} from "~/components/admin/primitives";
import { FONT, toneColor, toneSoft, withAlpha, type Tone } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAdminRoles, useAdminSettings, useUpdateSetting } from "~/hooks/useAdminData";

// Métadonnées présentationnelles du rôle ; l'effectif vient du backend.
const ROLE_META: Record<RoleSummary["role"], { name: string; desc: string; perms: string[]; tone: Tone; icon: string }> = {
  ADMIN: { name: "Administrateur", desc: "Accès complet · configuration & sécurité", perms: ["Tout gérer", "Sites & appareils", "Rôles"], tone: "primary", icon: "key" },
  HR: { name: "Ressources humaines", desc: "Employés, congés, rapports & paie", perms: ["Employés", "Valider congés", "Rapports"], tone: "accent", icon: "briefcase" },
  EMPLOYEE: { name: "Employé", desc: "Pointage, historique & demandes", perms: ["Pointer", "Ses demandes"], tone: "neutral", icon: "user" },
};

const soon = () => Toast.show({ type: "info", text1: "Nouveau rôle", text2: "Bientôt disponible." });

export default function RolesScreen() {
  const p = useAdminTheme();
  const roles = useAdminRoles();
  const settings = useAdminSettings();
  const updateSetting = useUpdateSetting();

  const s = settings.data;
  const roleList = roles.data ?? [];

  const toggle = (key: keyof AdminSettings, value: boolean) =>
    updateSetting.mutate(
      { key, value },
      { onError: () => Toast.show({ type: "error", text1: "Échec", text2: "Paramètre non enregistré." }) },
    );

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader
        sub="Accès & configuration"
        title="Rôles"
        right={<IconBtn icon="plus" tone="primary" onPress={soon} />}
      />

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
                    <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: p.ink }}>{meta.name}</Text>
                    <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
                      {meta.desc}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: FONT.display, fontSize: 18, color: p.ink }}>{r.members}</Text>
                    <Text style={{ fontFamily: FONT.semibold, fontSize: 10.5, color: p.muted2 }}>
                      membre{r.members > 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {meta.perms.map((perm) => (
                    <View
                      key={perm}
                      style={{
                        backgroundColor: p.surface2,
                        borderWidth: 1,
                        borderColor: p.line,
                        borderRadius: 999,
                        paddingHorizontal: 11,
                        paddingVertical: 5,
                      }}
                    >
                      <Text style={{ fontFamily: FONT.semibold, fontSize: 11.5, color: p.muted }}>{perm}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <SectionTitle>Paramètres de pointage</SectionTitle>
      <Card pad={0} style={{ overflow: "hidden" }}>
        <CfgRow icon="face" label="Reconnaissance faciale" detail={s ? `Seuil ${s.faceThreshold}%` : "—"} />
        <CfgRow
          icon="location"
          label="Géofencing"
          value={s?.geofencing ?? false}
          onToggle={(v) => toggle("geofencing", v)}
          disabled={!s}
        />
        <CfgRow icon="clockSmall" label="Horaires de travail" detail={s?.workHours ?? "—"} />
        <CfgRow
          icon="shield"
          label="Double pointage strict"
          value={s?.strictDoubleCheckin ?? false}
          onToggle={(v) => toggle("strictDoubleCheckin", v)}
          disabled={!s}
        />
        <CfgRow
          icon="bell"
          label="Alertes retards"
          value={s?.lateAlerts ?? false}
          onToggle={(v) => toggle("lateAlerts", v)}
          disabled={!s}
          last
        />
      </Card>
    </AdminScrollBody>
  );
}

function CfgRow({
  icon,
  label,
  detail,
  value,
  onToggle,
  disabled,
  last,
}: {
  icon: string;
  label: string;
  detail?: string;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  const p = useAdminTheme();
  const isToggle = onToggle != null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: p.line,
      }}
    >
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
    </View>
  );
}
