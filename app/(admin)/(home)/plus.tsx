import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { AdminIcon } from "~/components/admin/AdminIcon";
import { feedback } from "~/components/feedback";
import { initialsOf } from "~/components/admin/format";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  EmpAvatar,
  Pill,
} from "~/components/admin/primitives";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAppContextStore } from "~/stores/app-context.store";
import { useAuthStore } from "~/stores/auth.store";

interface HubItem {
  key: string;
  icon: string;
  route?: string;
  soon?: boolean;
  /** Réservé au mode école (horaire unique commun). */
  schoolOnly?: boolean;
}

const ITEMS: HubItem[] = [
  { key: "espace", icon: "swap" },
  { key: "equipe", icon: "users", route: "/(admin)/equipe" },
  { key: "equipes", icon: "grid", route: "/(admin)/equipes" },
  { key: "planning", icon: "calendar", route: "/(admin)/planning" },
  { key: "horaire", icon: "clock", route: "/(admin)/horaire-defaut", schoolOnly: true },
  { key: "schoolDashboard", icon: "bars", route: "/(admin)/school-dashboard", schoolOnly: true },
  { key: "historique", icon: "clock", route: "/(admin)/historique" },
  { key: "reports", icon: "bars", route: "/(admin)/reports" },
  { key: "sites", icon: "building", route: "/(admin)/sites" },
  { key: "roles", icon: "key", route: "/(admin)/roles" },
];

export default function MoreScreen() {
  const p = useAdminTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setViewMode = useAuthStore((s) => s.setViewMode);
  const isSchool = useAppContextStore((s) => s.context === "SCHOOL");

  const items = ITEMS.filter((it) => !it.schoolOnly || isSchool);
  const name = user ? `${user.firstName} ${user.lastName}` : t("admin.bo.plus.defaultName");

  const onItem = (it: HubItem) => {
    // Bascule vers l'interface employé (le back-office redevient accessible via
    // le même bouton dans l'espace employé) au lieu d'un espace admin parallèle.
    if (it.key === "espace") {
      setViewMode("employee");
      router.replace("/(tabs)");
      return;
    }
    if (it.soon || !it.route) {
      feedback.info(t(`admin.bo.plus.${it.key}Label`), t("admin.bo.plus.soonToast"));
      return;
    }
    router.push(it.route as never);
  };

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader sub={t("admin.bo.plus.sub")} title={t("admin.bo.plus.title")} />

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <EmpAvatar name={name} initials={initialsOf(user?.firstName, user?.lastName)} size={54} radius={18} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, color: p.ink }}>{name}</Text>
          <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
            {user?.email ?? ""}
          </Text>
          <View style={{ marginTop: 7 }}>
            <Pill tone="accent">{user?.role ? t(`admin.bo.roleLabels.${user.role}`) : "—"}</Pill>
          </View>
        </View>
      </Card>

      <Card pad={0} style={{ overflow: "hidden" }}>
        {items.map((it, i) => (
          <Pressable
            key={it.key}
            onPress={() => onItem(it)}
            android_ripple={{ color: withAlpha(p.primary, 0.08) }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 13,
              paddingVertical: 15,
              paddingHorizontal: 16,
              borderBottomWidth: i === items.length - 1 ? 0 : 1,
              borderBottomColor: p.line,
            }}
          >
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
              <AdminIcon name={it.icon} size={22} color={p.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontFamily: FONT.bold, fontSize: 14.5, color: p.ink }}>{t(`admin.bo.plus.${it.key}Label`)}</Text>
                {it.soon ? (
                  <View style={{ backgroundColor: p.surface2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: FONT.bold, fontSize: 10, color: p.muted2 }}>{t("admin.bo.plus.soon")}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>{t(`admin.bo.plus.${it.key}Desc`)}</Text>
            </View>
            <AdminIcon name="chevron" size={18} color={p.muted2} />
          </Pressable>
        ))}
      </Card>

      <Pressable
        onPress={() => void clearSession()}
        style={{
          borderWidth: 1,
          borderColor: withAlpha(p.danger, 0.3),
          backgroundColor: withAlpha(p.danger, 0.08),
          borderRadius: RADIUS.base,
          paddingVertical: 15,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
        }}
      >
        <AdminIcon name="logout" size={19} color={p.danger} />
        <Text style={{ fontFamily: FONT.bold, fontSize: 14.5, color: p.danger }}>{t("common.logout")}</Text>
      </Pressable>

      <Text style={{ textAlign: "center", fontFamily: FONT.body, fontSize: 11.5, color: p.muted2 }}>
        SmartAttendance Admin · v2.0
      </Text>
    </AdminScrollBody>
  );
}
