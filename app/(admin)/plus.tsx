import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { AdminIcon } from "~/components/admin/AdminIcon";
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
import { useAuthStore } from "~/stores/auth.store";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  HR: "Ressources humaines",
  EMPLOYEE: "Employé",
};

interface HubItem {
  key: string;
  icon: string;
  label: string;
  desc: string;
  route?: string;
  soon?: boolean;
}

const ITEMS: HubItem[] = [
  { key: "espace", icon: "user", label: "Mon espace", desc: "Profil, congés et pointages", route: "/(admin)/espace" },
  { key: "equipe", icon: "users", label: "Équipe", desc: "Annuaire & fiches employés", route: "/(admin)/equipe" },
  { key: "planning", icon: "calendar", label: "Planning des congés", desc: "Calendrier d'équipe", route: "/(admin)/planning" },
  { key: "reports", icon: "bars", label: "Rapports & exports", desc: "Assiduité, heures, congés", route: "/(admin)/reports" },
  { key: "sites", icon: "building", label: "Sites & pointeuses", desc: "Lieux & appareils", route: "/(admin)/sites" },
  { key: "roles", icon: "key", label: "Rôles & permissions", desc: "Accès & paramètres", route: "/(admin)/roles" },
];

export default function MoreScreen() {
  const p = useAdminTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const name = user ? `${user.firstName} ${user.lastName}` : "Administrateur";

  const onItem = (it: HubItem) => {
    if (it.soon || !it.route) {
      Toast.show({ type: "info", text1: it.label, text2: "Bientôt disponible." });
      return;
    }
    router.push(it.route as never);
  };

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader sub="Administration" title="Plus" />

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <EmpAvatar name={name} initials={initialsOf(user?.firstName, user?.lastName)} size={54} radius={18} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, color: p.ink }}>{name}</Text>
          <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
            {user?.email ?? ""}
          </Text>
          <View style={{ marginTop: 7 }}>
            <Pill tone="accent">{ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "—"}</Pill>
          </View>
        </View>
      </Card>

      <Card pad={0} style={{ overflow: "hidden" }}>
        {ITEMS.map((it, i) => (
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
              borderBottomWidth: i === ITEMS.length - 1 ? 0 : 1,
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
                <Text style={{ fontFamily: FONT.bold, fontSize: 14.5, color: p.ink }}>{it.label}</Text>
                {it.soon ? (
                  <View style={{ backgroundColor: p.surface2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: FONT.bold, fontSize: 10, color: p.muted2 }}>Bientôt</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>{it.desc}</Text>
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
        <Text style={{ fontFamily: FONT.bold, fontSize: 14.5, color: p.danger }}>Se déconnecter</Text>
      </Pressable>

      <Text style={{ textAlign: "center", fontFamily: FONT.body, fontSize: 11.5, color: p.muted2 }}>
        SmartAttendance Admin · v2.0
      </Text>
    </AdminScrollBody>
  );
}
