import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { feedback } from "~/components/feedback";
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
import { useLocation } from "~/hooks/useLocation";

export default function SitesScreen() {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const sites = useAdminSites();
  const devices = useAdminDevices();
  const [addOpen, setAddOpen] = useState(false);

  const siteList = sites.data ?? [];
  const deviceList = devices.data ?? [];

  return (
    <>
    <AdminScrollBody gap={12}>
      <AdminHeader
        backLabel={t("admin.bo.nav.more")}
        sub={t("admin.bo.sites.sub")}
        title={t("admin.bo.sites.title")}
        right={<IconBtn icon="plus" tone="primary" onPress={() => setAddOpen(true)} />}
      />

      {sites.isLoading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : siteList.length === 0 ? (
        <Card soft style={{ alignItems: "center", paddingVertical: 24 }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>{t("admin.bo.sites.none")}</Text>
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
                    <Text style={{ fontFamily: FONT.bold, fontSize: 11, color: p.muted }}>{t("admin.bo.sites.radius", { m: s.geofence })}</Text>
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
                  <StatBox value={`${s.present}/${s.total}`} label={t("admin.bo.sites.present")} />
                  <StatBox value={`${s.devices}`} label={t("admin.bo.sites.terminals", { count: s.devices })} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      <SectionTitle>{t("admin.bo.sites.devices")}</SectionTitle>
      {devices.isLoading ? (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : deviceList.length === 0 ? (
        <Card soft style={{ alignItems: "center", paddingVertical: 20 }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>{t("admin.bo.sites.noDevices")}</Text>
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
                    {online
                      ? t("admin.bo.sites.active")
                      : d.status === "PENDING"
                        ? t("admin.bo.sites.pending")
                        : t("admin.bo.sites.revoked")}
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
  const { t } = useTranslation();
  const create = useCreateSite();
  const { fetchCoords } = useLocation();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("100");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiBssid, setWifiBssid] = useState("");
  const [locating, setLocating] = useState(false);
  const [scanning, setScanning] = useState(false);

  const detectLocation = async () => {
    setLocating(true);
    try {
      const c = await fetchCoords();
      if (!c) {
        feedback.error(t("admin.bo.sites.locTitle"), t("admin.bo.sites.locFailed"));
        return;
      }
      setLat(String(c.latitude));
      setLng(String(c.longitude));
    } finally {
      setLocating(false);
    }
  };

  const detectWifi = async () => {
    setScanning(true);
    try {
      const fail = (msg: string) =>
        feedback.error(t("admin.bo.sites.wifiTitle"), msg);

      // Android n'expose le SSID que si la permission de localisation est accordée
      // ET que les services de localisation (GPS) sont activés sur l'appareil.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        fail(t("admin.bo.sites.wifiPermDenied"));
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        fail(t("admin.bo.sites.wifiLocationOff"));
        return;
      }

      // Par défaut NetInfo ne lit pas le SSID/BSSID (coûteux + permission) : il faut
      // l'activer explicitement, puis forcer une lecture native fraîche via refresh().
      NetInfo.configure({ shouldFetchWiFiSSID: true });
      const state = await NetInfo.refresh();
      if (state.type !== "wifi") {
        fail(t("admin.bo.sites.wifiNotConnected"));
        return;
      }
      const d = state.details as { ssid?: string | null; bssid?: string | null } | null;
      const ssid = d?.ssid?.replace(/^"|"$/g, "") ?? "";
      if (!ssid || ssid === "<unknown ssid>") {
        fail(t("admin.bo.sites.wifiFailed"));
        return;
      }
      setWifiSsid(ssid);
      setWifiBssid(d?.bssid ?? "");
    } finally {
      setScanning(false);
    }
  };

  const submit = () => {
    const latN = Number(lat.replace(",", "."));
    const lngN = Number(lng.replace(",", "."));
    if (!name.trim() || !address.trim()) {
      feedback.error(t("admin.bo.common.requiredFields"), t("admin.bo.sites.requiredMsg"));
      return;
    }
    if (!Number.isFinite(latN) || !Number.isFinite(lngN) || latN === 0 || lngN === 0) {
      feedback.error(t("admin.bo.sites.coordsTitle"), t("admin.bo.sites.coordsMsg"));
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
        wifiSSID: wifiSsid.trim() || undefined,
        wifiBSSID: wifiBssid.trim() || undefined,
      },
      {
        onSuccess: () => {
          onDone();
          feedback.success(t("admin.bo.sites.createdTitle"), name.trim());
        },
        onError: (e: any) =>
          feedback.error(
            t("admin.bo.common.createFailed"),
            e?.response?.data?.message ?? t("admin.bo.common.tryAgain"),
          ),
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

  const detectBtn = (label: string, icon: string, onPress: () => void, busy: boolean) => (
    <Pressable
      onPress={busy ? undefined : onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: RADIUS.base,
        borderWidth: 1,
        borderColor: withAlpha(p.primary, 0.4),
        backgroundColor: withAlpha(p.primary, 0.08),
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={p.primary} />
      ) : (
        <AdminIcon name={icon as any} size={15} color={p.primary} />
      )}
      <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: p.primary }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ gap: 15 }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>{t("admin.bo.sites.newSite")}</Text>
      {field(t("admin.bo.sites.name"), name, setName, "Siège — Casablanca")}
      {field(t("admin.bo.sites.address"), address, setAddress, "12 rue Hassan II")}
      {field(t("admin.bo.sites.city"), city, setCity, "Casablanca")}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {field(t("admin.bo.sites.latitude"), lat, setLat, "33.5731", true)}
        {field(t("admin.bo.sites.longitude"), lng, setLng, "-7.5898", true)}
      </View>
      {detectBtn(t("admin.bo.sites.detectLocation"), "location", detectLocation, locating)}
      {field(t("admin.bo.sites.geofenceRadius"), radius, setRadius, "100", true)}

      <View style={{ gap: 8 }}>
        {field(t("admin.bo.sites.wifi"), wifiSsid, setWifiSsid, t("admin.bo.sites.wifiPlaceholder"))}
        {detectBtn(t("admin.bo.sites.detectWifi"), "wifi", detectWifi, scanning)}
      </View>

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
          {t("admin.bo.sites.geofenceInfo")}
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
          <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: "#fff" }}>{t("admin.bo.sites.create")}</Text>
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
