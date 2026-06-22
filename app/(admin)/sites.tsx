import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Switch, Text, TextInput, View } from "react-native";

import type { AdminSite, EmployeeAssignment } from "~/api/admin";
import { feedback } from "~/components/feedback";
import { AdminIcon } from "~/components/admin/AdminIcon";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  EmpAvatar,
  FilterChips,
  IconBtn,
  Pill,
  SearchBar,
  SectionTitle,
} from "~/components/admin/primitives";
import { Sheet } from "~/components/admin/Sheet";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import {
  useAdminDevices,
  useAdminSites,
  useCreateSite,
  useEmployeeDepartments,
  useEmployees,
  useSetSiteMembers,
  useSiteMembers,
  useUpdateSite,
} from "~/hooks/useAdminData";
import { useLocation } from "~/hooks/useLocation";
import { scanWifi } from "~/lib/wifi";

const initialsOf = (first?: string, last?: string) =>
  `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase() || "–";

export default function SitesScreen() {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const sites = useAdminSites();
  const devices = useAdminDevices();
  const [addOpen, setAddOpen] = useState(false);
  const [editSite, setEditSite] = useState<AdminSite | null>(null);
  const [staffSite, setStaffSite] = useState<AdminSite | null>(null);

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

                <View style={{ flexDirection: "row", gap: 9 }}>
                  <CardActionBtn
                    icon="edit"
                    label={t("admin.bo.sites.editBtn")}
                    onPress={() => setEditSite(s)}
                  />
                  <CardActionBtn
                    icon="users"
                    label={t("admin.bo.sites.staffBtn")}
                    onPress={() => setStaffSite(s)}
                  />
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
      <SiteForm onDone={() => setAddOpen(false)} />
    </Sheet>

    <Sheet open={!!editSite} onClose={() => setEditSite(null)}>
      {editSite ? <SiteForm site={editSite} onDone={() => setEditSite(null)} /> : null}
    </Sheet>

    <Sheet open={!!staffSite} onClose={() => setStaffSite(null)}>
      {staffSite ? <AssignStaffSheet site={staffSite} onDone={() => setStaffSite(null)} /> : null}
    </Sheet>
    </>
  );
}

function SiteForm({ site, onDone }: { site?: AdminSite; onDone: () => void }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const create = useCreateSite();
  const update = useUpdateSite();
  const { fetchCoords } = useLocation();
  const editing = !!site;
  const [name, setName] = useState(site?.name ?? "");
  const [address, setAddress] = useState(site?.address ?? "");
  const [city, setCity] = useState(site?.city ?? "");
  const [lat, setLat] = useState(site?.latitude != null ? String(site.latitude) : "");
  const [lng, setLng] = useState(site?.longitude != null ? String(site.longitude) : "");
  const [radius, setRadius] = useState(String(site?.radius ?? site?.geofence ?? 100));
  const [wifiSsid, setWifiSsid] = useState(site?.wifiSSID ?? "");
  const [wifiBssid, setWifiBssid] = useState(site?.wifiBSSID ?? "");
  const [active, setActive] = useState(site?.isActive ?? true);
  const [locating, setLocating] = useState(false);
  const [scanning, setScanning] = useState(false);

  const pending = create.isPending || update.isPending;

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
      const result = await scanWifi();
      if (!result.ok) {
        const msg: Record<typeof result.reason, string> = {
          permission: t("admin.bo.sites.wifiPermDenied"),
          "location-off": t("admin.bo.sites.wifiLocationOff"),
          "not-wifi": t("admin.bo.sites.wifiNotConnected"),
          unavailable: t("admin.bo.sites.wifiFailed"),
        };
        feedback.error(t("admin.bo.sites.wifiTitle"), msg[result.reason]);
        return;
      }
      setWifiSsid(result.wifi.ssid ?? "");
      setWifiBssid(result.wifi.bssid ?? "");
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
    const payload = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim() || undefined,
      latitude: latN,
      longitude: lngN,
      radius: Number(radius) || 100,
      wifiSSID: wifiSsid.trim() || undefined,
      wifiBSSID: wifiBssid.trim() || undefined,
    };

    if (editing) {
      update.mutate(
        { id: site!.id, input: { ...payload, isActive: active } },
        {
          onSuccess: () => {
            onDone();
            feedback.success(t("admin.bo.sites.updatedTitle"), name.trim());
          },
          onError: (e: any) =>
            feedback.error(
              t("admin.bo.common.createFailed"),
              e?.response?.data?.message ?? t("admin.bo.common.tryAgain"),
            ),
        },
      );
      return;
    }

    create.mutate(payload, {
      onSuccess: () => {
        onDone();
        feedback.success(t("admin.bo.sites.createdTitle"), name.trim());
      },
      onError: (e: any) =>
        feedback.error(
          t("admin.bo.common.createFailed"),
          e?.response?.data?.message ?? t("admin.bo.common.tryAgain"),
        ),
    });
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
      <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>
        {editing ? t("admin.bo.sites.editSite") : t("admin.bo.sites.newSite")}
      </Text>
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
        {field(t("admin.bo.sites.wifiBssid"), wifiBssid, setWifiBssid, t("admin.bo.sites.wifiBssidPlaceholder"))}
        {detectBtn(t("admin.bo.sites.detectWifi"), "wifi", detectWifi, scanning)}
      </View>

      {editing ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: p.surface2,
            borderRadius: RADIUS.base,
            borderWidth: 1,
            borderColor: p.line,
            padding: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 13.5, color: p.ink }}>{t("admin.bo.sites.activeLabel")}</Text>
            <Text style={{ fontFamily: FONT.body, fontSize: 11.5, color: p.muted, marginTop: 2 }}>
              {t("admin.bo.sites.activeHint")}
            </Text>
          </View>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: p.line, true: withAlpha(p.primary, 0.5) }}
            thumbColor={active ? p.primary : p.surface}
          />
        </View>
      ) : null}

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
        onPress={pending ? undefined : submit}
        style={{
          backgroundColor: p.primary,
          borderRadius: RADIUS.base,
          paddingVertical: 16,
          alignItems: "center",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: "#fff" }}>
            {editing ? t("admin.bo.sites.save") : t("admin.bo.sites.create")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function AssignStaffSheet({ site, onDone }: { site: AdminSite; onDone: () => void }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const members = useSiteMembers(site.id);
  const setMembers = useSetSiteMembers();
  const [search, setSearch] = useState("");
  const [assignment, setAssignment] = useState<"all" | EmployeeAssignment>("all");
  const [dept, setDept] = useState("all");
  const employees = useEmployees(search, dept === "all" ? undefined : dept, {
    siteId: site.id,
    assignment: assignment === "all" ? undefined : assignment,
  });
  const departmentsQuery = useEmployeeDepartments(search);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [seeded, setSeeded] = useState(false);

  // Initialise la sélection à partir des membres actuels (une seule fois).
  useEffect(() => {
    if (!seeded && members.data) {
      setSelected(new Set(members.data.map((m) => m.id)));
      setSeeded(true);
    }
  }, [members.data, seeded]);

  const rows = useMemo(
    () => employees.data?.pages.flatMap((pg) => pg.data ?? pg.items ?? []) ?? [],
    [employees.data],
  );

  const deptChips = useMemo(() => {
    const set = new Set<string>(departmentsQuery.data);
    rows.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    if (dept !== "all") set.add(dept);
    return [
      { key: "all", label: t("admin.bo.sites.filterDeptAll") },
      ...Array.from(set)
        .sort((a, b) => a.localeCompare(b))
        .map((d) => ({ key: d, label: d })),
    ];
  }, [departmentsQuery.data, rows, dept, t]);

  const assignmentChips = [
    { key: "all", label: t("admin.bo.sites.filterAll") },
    { key: "this", label: t("admin.bo.sites.filterThisSite") },
    { key: "unassigned", label: t("admin.bo.sites.filterUnassigned") },
    { key: "other", label: t("admin.bo.sites.filterOther") },
  ];

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const save = () => {
    setMembers.mutate(
      { siteId: site.id, userIds: [...selected] },
      {
        onSuccess: () => {
          onDone();
          feedback.success(t("admin.bo.sites.assignSaved"), site.name);
        },
        onError: (e: any) =>
          feedback.error(
            t("admin.bo.common.createFailed"),
            e?.response?.data?.message ?? t("admin.bo.common.tryAgain"),
          ),
      },
    );
  };

  const loading = members.isLoading || (employees.isLoading && rows.length === 0);

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 3 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>{t("admin.bo.sites.assignTitle")}</Text>
        <Text style={{ fontFamily: FONT.semibold, fontSize: 12.5, color: p.muted }}>
          {site.name} · {t("admin.bo.sites.assignSelected", { count: selected.size })}
        </Text>
      </View>

      <SearchBar placeholder={t("admin.bo.sites.assignSearch")} value={search} onChange={setSearch} />
      <FilterChips
        options={assignmentChips}
        value={assignment}
        onChange={(k) => setAssignment(k as "all" | EmployeeAssignment)}
      />
      {deptChips.length > 1 ? (
        <FilterChips options={deptChips} value={dept} onChange={setDept} />
      ) : null}

      {loading ? (
        <View style={{ paddingVertical: 30, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : rows.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>{t("admin.bo.sites.assignEmpty")}</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {rows.map((emp) => {
            const on = selected.has(emp.id);
            const otherSite = emp.site && emp.site.id !== site.id;
            return (
              <Pressable
                key={emp.id}
                onPress={() => toggle(emp.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 11,
                  paddingHorizontal: 13,
                  borderRadius: RADIUS.base,
                  borderWidth: 1.5,
                  borderColor: on ? p.primary : p.line,
                  backgroundColor: on ? withAlpha(p.primary, 0.07) : p.surface,
                }}
              >
                <EmpAvatar
                  name={`${emp.firstName} ${emp.lastName}`}
                  initials={initialsOf(emp.firstName, emp.lastName)}
                  size={40}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>
                    {emp.firstName} {emp.lastName}
                  </Text>
                  <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 11.5, color: p.muted }}>
                    {emp.position || emp.department || emp.email}
                    {otherSite ? ` · ${emp.site?.name ?? t("admin.bo.sites.assignOtherSite")}` : ""}
                  </Text>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: on ? p.primary : p.line,
                    backgroundColor: on ? p.primary : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {on ? <AdminIcon name="check" size={15} color="#fff" /> : null}
                </View>
              </Pressable>
            );
          })}
          {employees.hasNextPage ? (
            <Pressable
              onPress={() => employees.fetchNextPage()}
              disabled={employees.isFetchingNextPage}
              style={{ paddingVertical: 12, alignItems: "center" }}
            >
              {employees.isFetchingNextPage ? (
                <ActivityIndicator size="small" color={p.primary} />
              ) : (
                <Text style={{ fontFamily: FONT.bold, fontSize: 13, color: p.primary }}>
                  {t("admin.bo.common.loadMore")}
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      )}

      <Pressable
        onPress={setMembers.isPending ? undefined : save}
        style={{
          backgroundColor: p.primary,
          borderRadius: RADIUS.base,
          paddingVertical: 16,
          alignItems: "center",
          opacity: setMembers.isPending ? 0.7 : 1,
        }}
      >
        {setMembers.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: "#fff" }}>{t("admin.bo.sites.assignSave")}</Text>
        )}
      </Pressable>
    </View>
  );
}

function CardActionBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const p = useAdminTheme();
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: withAlpha(p.primary, 0.08) }}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        paddingVertical: 11,
        borderRadius: RADIUS.base,
        borderWidth: 1,
        borderColor: p.line,
        backgroundColor: p.surface2,
      }}
    >
      <AdminIcon name={icon as any} size={15} color={p.primary} />
      <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: p.ink }}>{label}</Text>
    </Pressable>
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
