import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import type { UpdateEmployeeProfileInput } from "~/api/admin";
import { humanizeApiError } from "~/api/client";
import { buildPhotoUrl } from "~/api/users";
import { AdminIcon } from "~/components/admin/AdminIcon";
import { initialsOf } from "~/components/admin/format";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  EmpAvatar,
  Pill,
  SectionTitle,
} from "~/components/admin/primitives";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { feedback } from "~/components/feedback";
import { useEmployeeProfile, useUpdateEmployeeProfile } from "~/hooks/useAdminData";

const GENDERS = ["M", "F", "Other"] as const;
const EDUCATION = ["BAC", "BAC+2", "BAC+3", "BAC+5", "BAC+8"] as const;

const toYMD = (d?: string | null) => (d ? new Date(d).toISOString().split("T")[0] : "");

export default function EmployeeProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const p = useAdminTheme();
  const { t, i18n } = useTranslation();
  const profileQuery = useEmployeeProfile(id);
  const update = useUpdateEmployeeProfile(id ?? "");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateEmployeeProfileInput>({});

  const profile = profileQuery.data;
  const locale = i18n.language?.startsWith("en") ? "en-US" : "fr-FR";
  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString(locale) : "—";

  const set = (k: keyof UpdateEmployeeProfileInput, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const startEdit = () => {
    if (!profile) return;
    setForm({
      phone: profile.phone ?? "",
      position: profile.position ?? "",
      department: profile.department ?? "",
      address: profile.address ?? "",
      bio: profile.bio ?? "",
      emergencyContact: profile.emergencyContact ?? "",
      gender: profile.gender ?? "",
      educationLevel: profile.educationLevel ?? "",
      dateOfBirth: toYMD(profile.dateOfBirth),
      hireDate: toYMD(profile.hireDate),
    });
    setEditing(true);
  };

  const save = () => {
    update.mutate(
      {
        ...form,
        position: form.position?.trim() || null,
        phone: form.phone?.trim() || null,
        department: form.department?.trim() || null,
        address: form.address?.trim() || null,
        bio: form.bio?.trim() || null,
        emergencyContact: form.emergencyContact?.trim() || null,
        gender: form.gender || null,
        educationLevel: form.educationLevel || null,
        dateOfBirth: form.dateOfBirth?.trim() || null,
        hireDate: form.hireDate?.trim() || null,
      },
      {
        onSuccess: () => {
          setEditing(false);
          feedback.success(t("admin.bo.profile.saved"));
        },
        onError: (e: any) =>
          feedback.error(
            t("admin.bo.common.createFailed"),
            humanizeApiError(e),
          ),
      },
    );
  };

  const name = profile ? `${profile.firstName} ${profile.lastName}` : "";
  const photo = buildPhotoUrl(profile?.photoUrl);
  const genderLabel = (g?: string | null) =>
    g === "M"
      ? t("admin.bo.profile.genderM")
      : g === "F"
        ? t("admin.bo.profile.genderF")
        : g === "Other"
          ? t("admin.bo.profile.genderOther")
          : "—";

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader
        backLabel={t("admin.bo.equipe.title")}
        onBack={() => router.back()}
        sub={t("admin.bo.profile.sub")}
        title={name || t("admin.bo.profile.sub")}
        right={
          profile ? (
            <Pressable
              onPress={editing ? save : startEdit}
              disabled={update.isPending}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                paddingVertical: 9,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: p.primary,
                opacity: update.isPending ? 0.7 : 1,
              }}
            >
              {update.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <AdminIcon name={editing ? "check" : "edit"} size={15} color="#fff" />
              )}
              <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: "#fff" }}>
                {editing ? t("admin.bo.profile.save") : t("admin.bo.profile.edit")}
              </Text>
            </Pressable>
          ) : null
        }
      />

      {profileQuery.isLoading ? (
        <View style={{ paddingTop: 50, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : !profile ? (
        <Card soft style={{ alignItems: "center", paddingVertical: 24 }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 13, color: p.muted }}>
            {t("admin.bo.profile.notFound")}
          </Text>
        </Card>
      ) : (
        <>
          {/* En-tête : photo, nom, rôle */}
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={{ width: 64, height: 64, borderRadius: 20 }}
              />
            ) : (
              <EmpAvatar
                name={name}
                initials={initialsOf(profile.firstName, profile.lastName)}
                size={64}
                radius={20}
              />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 19, color: p.ink }}>{name}</Text>
              <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }} numberOfLines={1}>
                {profile.email}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
                <Pill tone="accent">{t(`admin.bo.roleLabels.${profile.role}`)}</Pill>
                {profile.team?.name ? <Pill tone="neutral">{profile.team.name}</Pill> : null}
              </View>
            </View>
          </Card>

          {/* Statistiques */}
          <SectionTitle>{t("admin.bo.profile.stats")}</SectionTitle>
          <Card style={{ gap: 14 }}>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: FONT.semibold, fontSize: 13, color: p.ink }}>
                  {t("admin.bo.profile.attendanceScore")}
                </Text>
                <Text
                  style={{
                    fontFamily: FONT.display,
                    fontSize: 20,
                    color: scoreColor(profile.stats.attendanceScore, p),
                  }}
                >
                  {profile.stats.attendanceScore}/100
                </Text>
              </View>
              <View style={{ height: 8, borderRadius: 999, backgroundColor: p.surface2, overflow: "hidden" }}>
                <View
                  style={{
                    width: `${Math.min(100, Math.max(0, profile.stats.attendanceScore))}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: scoreColor(profile.stats.attendanceScore, p),
                  }}
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
              <StatTile label={t("admin.bo.profile.checkIns")} value={String(profile.stats.totalCheckIns)} />
              <StatTile label={t("admin.bo.profile.hours")} value={`${Math.round(profile.stats.totalHours)}h`} />
              <StatTile label={t("admin.bo.profile.late")} value={String(profile.stats.lateCount)} />
              <StatTile label={t("admin.bo.profile.absences")} value={String(profile.stats.absences)} />
            </View>
          </Card>

          {/* Informations personnelles */}
          <SectionTitle>{t("admin.bo.profile.personalInfo")}</SectionTitle>
          <Card style={{ gap: 12 }}>
            <ReadRow icon="mail" label={t("admin.bo.profile.email")} value={profile.email} />

            {editing ? (
              <>
                <EditField
                  label={t("admin.bo.profile.phone")}
                  value={form.phone ?? ""}
                  onChange={(v) => set("phone", v)}
                  placeholder={t("admin.bo.equipe.phonePlaceholder")}
                  keyboardType="phone-pad"
                />
                <EditField label={t("admin.bo.profile.position")} value={form.position ?? ""} onChange={(v) => set("position", v)} />
                <EditField label={t("admin.bo.profile.department")} value={form.department ?? ""} onChange={(v) => set("department", v)} />
                <DatePickerField
                  label={t("admin.bo.profile.hireDate")}
                  value={form.hireDate ?? ""}
                  onChange={(v) => set("hireDate", v)}
                />
                <EditField label={t("admin.bo.profile.address")} value={form.address ?? ""} onChange={(v) => set("address", v)} />
                <DatePickerField
                  label={t("admin.bo.profile.dateOfBirth")}
                  value={form.dateOfBirth ?? ""}
                  onChange={(v) => set("dateOfBirth", v)}
                  maximumDate={new Date()}
                />
                <ChipSelect
                  label={t("admin.bo.profile.gender")}
                  options={GENDERS.map((g) => ({ key: g, label: genderLabel(g) }))}
                  value={form.gender ?? ""}
                  onChange={(v) => set("gender", v)}
                />
                <ChipSelect
                  label={t("admin.bo.profile.educationLevel")}
                  options={EDUCATION.map((e) => ({ key: e, label: e }))}
                  value={form.educationLevel ?? ""}
                  onChange={(v) => set("educationLevel", v)}
                />
                <EditField
                  label={t("admin.bo.profile.emergencyContact")}
                  value={form.emergencyContact ?? ""}
                  onChange={(v) => set("emergencyContact", v)}
                />
                <EditField
                  label={t("admin.bo.profile.bio")}
                  value={form.bio ?? ""}
                  onChange={(v) => set("bio", v)}
                  multiline
                />
              </>
            ) : (
              <>
                <ReadRow icon="phone" label={t("admin.bo.profile.phone")} value={profile.phone || "—"} />
                <ReadRow icon="briefcase" label={t("admin.bo.profile.position")} value={profile.position || "—"} />
                <ReadRow icon="building" label={t("admin.bo.profile.department")} value={profile.department || "—"} />
                <ReadRow icon="calendar" label={t("admin.bo.profile.hireDate")} value={fmtDate(profile.hireDate)} />
                <ReadRow icon="location" label={t("admin.bo.profile.address")} value={profile.address || "—"} />
                <ReadRow icon="calendar" label={t("admin.bo.profile.dateOfBirth")} value={fmtDate(profile.dateOfBirth)} />
                <ReadRow icon="user" label={t("admin.bo.profile.gender")} value={genderLabel(profile.gender)} />
                <ReadRow icon="award" label={t("admin.bo.profile.educationLevel")} value={profile.educationLevel || "—"} />
                <ReadRow icon="shield" label={t("admin.bo.profile.emergencyContact")} value={profile.emergencyContact || "—"} />
                {profile.bio ? <ReadRow icon="doc" label={t("admin.bo.profile.bio")} value={profile.bio} /> : null}
              </>
            )}
          </Card>
        </>
      )}
    </AdminScrollBody>
  );
}

function scoreColor(score: number, p: ReturnType<typeof useAdminTheme>) {
  if (score >= 80) return p.success;
  if (score >= 60) return p.warning;
  return p.danger;
}

function StatTile({ label, value }: { label: string; value: string }) {
  const p = useAdminTheme();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "47%",
        backgroundColor: p.surface2,
        borderWidth: 1,
        borderColor: p.line,
        borderRadius: RADIUS.base,
        paddingVertical: 12,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ fontFamily: FONT.display, fontSize: 22, color: p.ink }}>{value}</Text>
      <Text
        style={{
          fontFamily: FONT.bold,
          fontSize: 10.5,
          color: p.muted2,
          textTransform: "uppercase",
          letterSpacing: 0.2,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function ReadRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const p = useAdminTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: withAlpha(p.primary, 0.1),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AdminIcon name={icon} size={17} color={p.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 10.5, color: p.muted2, textTransform: "uppercase", letterSpacing: 0.2 }}>
          {label}
        </Text>
        <Text style={{ fontFamily: FONT.medium, fontSize: 13.5, color: p.ink, marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );
}

function EditField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address";
}) {
  const p = useAdminTheme();
  return (
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
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={p.muted2}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          marginTop: 7,
          paddingVertical: multiline ? 11 : 12,
          paddingHorizontal: 14,
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? "top" : "center",
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
}

function DatePickerField({
  label,
  value,
  onChange,
  maximumDate,
}: {
  label: string;
  value: string;
  onChange: (ymd: string) => void;
  maximumDate?: Date;
}) {
  const p = useAdminTheme();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const locale = i18n.language?.startsWith("en") ? "en-US" : "fr-FR";
  const dateVal = value ? new Date(value) : null;

  return (
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
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          marginTop: 7,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: RADIUS.base,
          backgroundColor: p.surface2,
          borderWidth: 1,
          borderColor: p.line,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: FONT.medium,
            fontSize: 14,
            color: dateVal ? p.ink : p.muted2,
          }}
        >
          {dateVal ? dateVal.toLocaleDateString(locale) : t("admin.bo.profile.datePlaceholder")}
        </Text>
        {value ? (
          <Pressable hitSlop={8} onPress={() => onChange("")}>
            <AdminIcon name="xmark" size={16} color={p.muted2} />
          </Pressable>
        ) : null}
        <AdminIcon name="calendar" size={17} color={p.primary} />
      </Pressable>

      {open ? (
        <DateTimePicker
          value={dateVal ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          maximumDate={maximumDate}
          onChange={(_, selected) => {
            if (Platform.OS === "android") setOpen(false);
            if (selected) onChange(selected.toISOString().split("T")[0]);
          }}
        />
      ) : null}
    </View>
  );
}

function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const p = useAdminTheme();
  return (
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
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        {options.map((o) => {
          const on = value === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(on ? "" : o.key)}
              style={{
                borderWidth: 1,
                borderColor: on ? p.primary : p.line,
                backgroundColor: on ? withAlpha(p.primary, 0.12) : p.surface2,
                borderRadius: 999,
                paddingHorizontal: 13,
                paddingVertical: 9,
              }}
            >
              <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: on ? p.primary : p.muted }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
