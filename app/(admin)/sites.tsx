import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { AdminIcon } from "~/components/admin/AdminIcon";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  IconBtn,
  Pill,
  SectionTitle,
} from "~/components/admin/primitives";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAdminDevices, useAdminSites } from "~/hooks/useAdminData";

const soon = () => Toast.show({ type: "info", text1: "Nouveau site", text2: "Bientôt disponible." });

export default function SitesScreen() {
  const p = useAdminTheme();
  const sites = useAdminSites();
  const devices = useAdminDevices();

  const siteList = sites.data ?? [];
  const deviceList = devices.data ?? [];

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader
        sub="Lieux & pointeuses"
        title="Sites"
        right={<IconBtn icon="plus" tone="primary" onPress={soon} />}
      />

      {sites.isLoading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : siteList.length === 0 ? (
        <Card soft style={{ alignItems: "center", paddingVertical: 24 }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>Aucun site configuré.</Text>
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {siteList.map((s) => (
            <Card key={s.id} pad={0} style={{ overflow: "hidden" }}>
              <LinearGradient
                colors={[withAlpha(p.primary, 0.16), p.surface2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ height: 92, alignItems: "center", justifyContent: "center" }}
              >
                <View
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: p.primary,
                    backgroundColor: withAlpha(p.primary, 0.14),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AdminIcon name="location" size={26} color={p.primary} />
                </View>
                {s.geofence > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                      backgroundColor: p.surface,
                    }}
                  >
                    <Text style={{ fontFamily: FONT.bold, fontSize: 11, color: p.muted }}>Rayon {s.geofence} m</Text>
                  </View>
                ) : null}
              </LinearGradient>

              <View style={{ padding: 15, gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: FONT.display, fontSize: 16.5, color: p.ink }}>{s.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                      <AdminIcon name="building" size={13} color={p.muted} />
                      <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
                        {s.address}
                      </Text>
                    </View>
                  </View>
                  <Pill tone={s.status === "Opérationnel" ? "success" : "neutral"} dot>
                    {s.status}
                  </Pill>
                </View>

                <View style={{ flexDirection: "row", gap: 9 }}>
                  <StatBox value={`${s.present}/${s.total}`} label="présents" />
                  <StatBox value={`${s.devices}`} label={`pointeuse${s.devices > 1 ? "s" : ""}`} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      <SectionTitle>Appareils</SectionTitle>
      {devices.isLoading ? (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : deviceList.length === 0 ? (
        <Card soft style={{ alignItems: "center", paddingVertical: 20 }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>Aucun appareil enregistré.</Text>
        </Card>
      ) : (
        <Card pad={0} style={{ overflow: "hidden" }}>
          {deviceList.map((d, i) => {
            const online = d.status === "ACTIVE";
            return (
              <View
                key={d.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 15,
                  borderBottomWidth: i === deviceList.length - 1 ? 0 : 1,
                  borderBottomColor: p.line,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: online ? withAlpha(p.success, 0.14) : p.surface2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AdminIcon name="cpu" size={19} color={online ? p.success : p.muted2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>
                    {d.deviceName}
                  </Text>
                  <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 11.5, color: p.muted }}>
                    {d.user?.site?.name ?? "—"} · {d.platform}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View
                    style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: online ? p.success : p.muted2 }}
                  />
                  <Text style={{ fontFamily: FONT.bold, fontSize: 11.5, color: online ? p.success : p.muted2 }}>
                    {online ? "Actif" : d.status === "PENDING" ? "En attente" : "Révoqué"}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </AdminScrollBody>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  const p = useAdminTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: p.surface2,
        borderRadius: RADIUS.sm,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: p.line,
      }}
    >
      <Text style={{ fontFamily: FONT.display, fontSize: 17, color: p.ink }}>{value}</Text>
      <Text style={{ fontFamily: FONT.semibold, fontSize: 11, color: p.muted }}>{label}</Text>
    </View>
  );
}
