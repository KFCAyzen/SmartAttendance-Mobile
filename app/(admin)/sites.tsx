import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
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
import { Sheet } from "~/components/admin/Sheet";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAdminDevices, useAdminSites, useCreateSite } from "~/hooks/useAdminData";

export default function SitesScreen() {
  const p = useAdminTheme();
  const sites = useAdminSites();
  const devices = useAdminDevices();
  const [addOpen, setAddOpen] = useState(false);

  const siteList = sites.data ?? [];
  const deviceList = devices.data ?? [];

  return (
    <>
    <AdminScrollBody gap={12}>
      <AdminHeader
        sub="Lieux & pointeuses"
        title="Sites"
        right={<IconBtn icon="plus" tone="primary" onPress={() => setAddOpen(true)} />}
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

    <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
      <AddSiteForm onDone={() => setAddOpen(false)} />
    </Sheet>
    </>
  );
}

function AddSiteForm({ onDone }: { onDone: () => void }) {
  const p = useAdminTheme();
  const create = useCreateSite();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("100");

  const submit = () => {
    const latN = Number(lat.replace(",", "."));
    const lngN = Number(lng.replace(",", "."));
    if (!name.trim() || !address.trim()) {
      Toast.show({ type: "error", text1: "Champs requis", text2: "Nom et adresse sont obligatoires." });
      return;
    }
    if (!Number.isFinite(latN) || !Number.isFinite(lngN) || latN === 0 || lngN === 0) {
      Toast.show({ type: "error", text1: "Coordonnées invalides", text2: "Renseignez une latitude et une longitude." });
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        address: address.trim(),
        city: city.trim() || undefined,
        latitude: latN,
        longitude: lngN,
        radius: Number(radius) || 100,
      },
      {
        onSuccess: () => {
          onDone();
          Toast.show({ type: "success", text1: "Site créé", text2: name.trim() });
        },
        onError: (e: any) =>
          Toast.show({
            type: "error",
            text1: "Création impossible",
            text2: e?.response?.data?.message ?? "Veuillez réessayer.",
          }),
      },
    );
  };

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    numeric?: boolean,
  ) => (
    <View style={{ flex: 1 }}>
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
        keyboardType={numeric ? "numbers-and-punctuation" : "default"}
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
      <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>Nouveau site</Text>
      {field("Nom", name, setName, "Siège — Casablanca")}
      {field("Adresse", address, setAddress, "12 rue Hassan II")}
      {field("Ville", city, setCity, "Casablanca")}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {field("Latitude", lat, setLat, "33.5731", true)}
        {field("Longitude", lng, setLng, "-7.5898", true)}
      </View>
      {field("Rayon de géofencing (m)", radius, setRadius, "100", true)}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 9,
          backgroundColor: withAlpha(p.primary, 0.12),
          borderRadius: RADIUS.base,
          padding: 12,
          paddingHorizontal: 14,
        }}
      >
        <AdminIcon name="location" size={16} color={p.primary} />
        <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: 12.5, color: p.primary }}>
          Les pointages hors du rayon seront refusés.
        </Text>
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
          <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: "#fff" }}>Créer le site</Text>
        )}
      </Pressable>
    </View>
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
