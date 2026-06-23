import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from "react-native";

import type { AdminAbsence, AdminDevice, AdminLeave, PhotoRequest } from "~/api/admin";
import { buildPhotoUrl } from "~/api/users";
import { AdminIcon } from "~/components/admin/AdminIcon";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  EmpAvatar,
  Pill,
  Segmented,
} from "~/components/admin/primitives";
import { Sheet } from "~/components/admin/Sheet";
import { feedback } from "~/components/feedback";
import { initialsOf } from "~/components/admin/format";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useAuthStore } from "~/stores/auth.store";
import i18n from "~/i18n";
import {
  useAdminActions,
  useAdminDevices,
  useApproveDevice,
  useApprovePhotoRequest,
  usePendingAbsences,
  usePendingLeaves,
  usePhotoRequests,
  useRejectPhotoRequest,
  useRevokeDevice,
} from "~/hooks/useAdminData";

const REJECT_PRESET_KEYS = ["presetBalance", "presetBusy", "presetMissingDoc", "presetConflict"] as const;

function fmtDay(iso: string): string {
  const locale = i18n.language?.startsWith("en") ? "en-US" : "fr-FR";
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long" });
}

function dayCount(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

type ValidTab = "leave" | "absence" | "device" | "photo";

export default function ValidationScreen() {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState<ValidTab>("leave");
  // Appareils & photos : endpoints réservés ADMIN côté serveur (un HR aurait un 403).
  const isAdmin = useAuthStore((s) => s.user?.role === "ADMIN");
  const leaves = usePendingLeaves();
  const absences = usePendingAbsences();
  const devices = useAdminDevices();
  const photos = usePhotoRequests();

  const leaveItems = (leaves.data?.pages ?? []).flatMap((pg) => pg.data ?? pg.items ?? []);
  const absenceItems = (absences.data?.pages ?? []).flatMap((pg) => pg.data ?? pg.items ?? []);
  // Seuls les appareils en attente nécessitent une action de validation.
  const deviceItems = (devices.data ?? []).filter((d) => d.status === "PENDING");
  const photoItems = photos.data ?? [];

  const loading =
    tab === "leave"
      ? leaves.isLoading
      : tab === "absence"
        ? absences.isLoading
        : tab === "device"
          ? devices.isLoading
          : photos.isLoading;

  const count =
    tab === "leave"
      ? leaveItems.length
      : tab === "absence"
        ? absenceItems.length
        : tab === "device"
          ? deviceItems.length
          : photoItems.length;

  const refreshing =
    leaves.isRefetching ||
    absences.isRefetching ||
    devices.isRefetching ||
    photos.isRefetching;
  const onRefresh = () => {
    leaves.refetch();
    absences.refetch();
    if (isAdmin) {
      devices.refetch();
      photos.refetch();
    }
  };

  return (
    <AdminScrollBody gap={12} refreshing={refreshing} onRefresh={onRefresh}>
      <AdminHeader sub={t("admin.bo.valider.sub")} title={t("admin.bo.valider.title")} />
      <Segmented
        value={tab}
        onChange={(k) => setTab(k as ValidTab)}
        options={[
          { key: "leave", label: t("admin.bo.valider.leaves"), count: leaveItems.length },
          { key: "absence", label: t("admin.bo.valider.absences"), count: absenceItems.length },
          ...(isAdmin
            ? [
                { key: "device", label: t("admin.bo.valider.devices"), count: deviceItems.length },
                { key: "photo", label: t("admin.bo.valider.photos"), count: photoItems.length },
              ]
            : []),
        ]}
      />

      {loading ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : count === 0 ? (
        <Card soft style={{ alignItems: "center", gap: 8, paddingVertical: 26 }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 16,
              backgroundColor: withAlpha(p.success, 0.14),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AdminIcon name="checkCircle" size={24} color={p.success} />
          </View>
          <Text style={{ fontFamily: FONT.display, fontSize: 15, color: p.ink }}>{t("admin.bo.valider.allDone")}</Text>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
            {t("admin.bo.valider.noPending")}
          </Text>
        </Card>
      ) : (
        <View style={{ gap: 11 }}>
          {tab === "leave"
            ? leaveItems.map((it) => <LeaveCard key={it.id} item={it} />)
            : tab === "absence"
              ? absenceItems.map((it) => <AbsenceCard key={it.id} item={it} />)
              : tab === "device"
                ? deviceItems.map((it) => <DeviceCard key={it.id} item={it} />)
                : photoItems.map((it) => <PhotoCard key={it.id} item={it} />)}
        </View>
      )}
    </AdminScrollBody>
  );
}

function Resolved({ name, approved }: { name: string; approved: boolean }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const color = approved ? p.success : p.danger;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 13,
        paddingHorizontal: 16,
        borderRadius: RADIUS.lg,
        backgroundColor: withAlpha(color, 0.1),
        borderWidth: 1,
        borderColor: withAlpha(color, 0.24),
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AdminIcon name={approved ? "check" : "xmark"} size={19} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>{name}</Text>
        <Text style={{ fontFamily: FONT.semibold, fontSize: 12, color }}>
          {approved ? t("admin.bo.valider.approved") : t("admin.bo.valider.rejected")}
        </Text>
      </View>
    </View>
  );
}

function RejectReasonSheet({
  open,
  onClose,
  name,
  pending,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  pending: boolean;
  onConfirm: (reason: string) => void;
}) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const presets = REJECT_PRESET_KEYS.map((k) => t(`admin.bo.valider.${k}`));

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ gap: 14 }}>
        <View style={{ gap: 3 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>{t("admin.bo.valider.rejectTitle")}</Text>
          <Text style={{ fontFamily: FONT.body, fontSize: 13, color: p.muted }}>{name}</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {presets.map((r) => {
            const on = reason === r;
            return (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                style={{
                  borderWidth: 1,
                  borderColor: on ? p.danger : p.line,
                  backgroundColor: on ? withAlpha(p.danger, 0.12) : p.surface2,
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ fontFamily: FONT.semibold, fontSize: 12.5, color: on ? p.danger : p.muted }}>{r}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder={t("admin.bo.valider.reasonPlaceholder")}
          placeholderTextColor={p.muted2}
          multiline
          style={{
            minHeight: 80,
            paddingVertical: 13,
            paddingHorizontal: 14,
            borderRadius: RADIUS.base,
            backgroundColor: p.surface2,
            borderWidth: 1,
            borderColor: p.line,
            fontFamily: FONT.medium,
            fontSize: 14,
            color: p.ink,
            textAlignVertical: "top",
          }}
        />

        <Pressable
          onPress={pending ? undefined : () => onConfirm(reason.trim() || t("admin.bo.valider.defaultComment"))}
          style={{
            backgroundColor: p.danger,
            borderRadius: RADIUS.base,
            paddingVertical: 16,
            alignItems: "center",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: "#fff" }}>{t("admin.bo.valider.confirmReject")}</Text>
          )}
        </Pressable>
      </View>
    </Sheet>
  );
}

function ActionRow({
  pending,
  onApprove,
  onReject,
}: {
  pending: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: "row", gap: 9 }}>
      <Card
        soft
        pad={0}
        onPress={pending ? undefined : onReject}
        style={{ flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: p.surface, borderColor: p.line }}
      >
        <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: p.danger }}>{t("admin.bo.valider.reject")}</Text>
      </Card>
      <Card
        pad={0}
        onPress={pending ? undefined : onApprove}
        style={{
          flex: 1.4,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          backgroundColor: p.primary,
          borderColor: "transparent",
          shadowColor: p.primary,
          shadowOpacity: 0.38,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        {pending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <AdminIcon name="check" size={17} color="#fff" />
            <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: "#fff" }}>{t("admin.bo.valider.approve")}</Text>
          </>
        )}
      </Card>
    </View>
  );
}

function ApprovalShell({
  name,
  initials,
  dept,
  typeLabel,
  typeTone,
  children,
}: {
  name: string;
  initials: string;
  dept: string;
  typeLabel: string;
  typeTone: "primary" | "warning";
  children: React.ReactNode;
}) {
  const p = useAdminTheme();
  return (
    <Card style={{ gap: 13 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <EmpAvatar name={name} initials={initials} size={42} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 15, color: p.ink }}>
            {name}
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
            {dept}
          </Text>
        </View>
        <Pill tone={typeTone}>{typeLabel}</Pill>
      </View>
      {children}
    </Card>
  );
}

function InfoBox({ icon, line1, line2 }: { icon: string; line1: string; line2: string }) {
  const p = useAdminTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        padding: 12,
        paddingHorizontal: 14,
        borderRadius: RADIUS.base,
        backgroundColor: p.surface2,
        borderWidth: 1,
        borderColor: p.line,
      }}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <AdminIcon name={icon} size={14} color={p.primary} />
          <Text style={{ fontFamily: FONT.bold, fontSize: 13.5, color: p.ink }}>{line1}</Text>
        </View>
        <Text style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>{line2}</Text>
      </View>
    </View>
  );
}

function LeaveCard({ item }: { item: AdminLeave }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const { approveLeaveMutation, rejectLeaveMutation } = useAdminActions();
  const [done, setDone] = useState<null | boolean>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const name = item.user
    ? `${item.user.firstName} ${item.user.lastName}`
    : t("admin.bo.common.employee");
  const initials = initialsOf(item.user?.firstName, item.user?.lastName);
  const days = item.days ?? dayCount(item.startDate, item.endDate);
  const range =
    item.startDate === item.endDate
      ? fmtDay(item.startDate)
      : `${fmtDay(item.startDate)} – ${fmtDay(item.endDate)}`;
  const busy = approveLeaveMutation.isPending || rejectLeaveMutation.isPending;

  if (done !== null) return <Resolved name={name} approved={done} />;

  return (
    <ApprovalShell
      name={name}
      initials={initials}
      dept={item.user?.department ?? "—"}
      typeLabel={t(`leaveTypes.${item.type}`)}
      typeTone="primary"
    >
      <InfoBox icon="calendar" line1={range} line2={t("admin.bo.valider.days", { count: days })} />
      {item.reason ? (
        <View style={{ flexDirection: "row", gap: 7 }}>
          <AdminIcon name="doc" size={14} color={p.muted2} />
          <Text style={{ flex: 1, fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
            « {item.reason} »
          </Text>
        </View>
      ) : null}
      <ActionRow
        pending={busy}
        onApprove={() => approveLeaveMutation.mutate(item.id, { onSuccess: () => setDone(true) })}
        onReject={() => setRejectOpen(true)}
      />
      <RejectReasonSheet
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        name={name}
        pending={rejectLeaveMutation.isPending}
        onConfirm={(comment) =>
          rejectLeaveMutation.mutate(
            { id: item.id, comment },
            {
              onSuccess: () => {
                setRejectOpen(false);
                setDone(false);
              },
            },
          )
        }
      />
    </ApprovalShell>
  );
}

function AbsenceCard({ item }: { item: AdminAbsence }) {
  const { t } = useTranslation();
  const { approveAbsenceMutation, rejectAbsenceMutation } = useAdminActions();
  const [done, setDone] = useState<null | boolean>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const name = item.user ? `${item.user.firstName} ${item.user.lastName}` : t("admin.bo.common.employee");
  const initials = initialsOf(item.user?.firstName, item.user?.lastName);
  const busy = approveAbsenceMutation.isPending || rejectAbsenceMutation.isPending;

  if (done !== null) return <Resolved name={name} approved={done} />;

  return (
    <ApprovalShell
      name={name}
      initials={initials}
      dept={item.user?.department ?? "—"}
      typeLabel={t(`absenceTypes.${item.type}`)}
      typeTone="warning"
    >
      <InfoBox
        icon="calendar"
        line1={fmtDay(item.date)}
        line2={item.reason ?? item.duration ?? t("admin.bo.valider.noDocument")}
      />
      <ActionRow
        pending={busy}
        onApprove={() =>
          approveAbsenceMutation.mutate(
            { id: item.id, comment: "" },
            { onSuccess: () => setDone(true) },
          )
        }
        onReject={() => setRejectOpen(true)}
      />
      <RejectReasonSheet
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        name={name}
        pending={rejectAbsenceMutation.isPending}
        onConfirm={(comment) =>
          rejectAbsenceMutation.mutate(
            { id: item.id, comment },
            {
              onSuccess: () => {
                setRejectOpen(false);
                setDone(false);
              },
            },
          )
        }
      />
    </ApprovalShell>
  );
}

function DeviceCard({ item }: { item: AdminDevice }) {
  const { t } = useTranslation();
  const approve = useApproveDevice();
  const revoke = useRevokeDevice();
  const [done, setDone] = useState<null | boolean>(null);
  const name = item.user
    ? `${item.user.firstName} ${item.user.lastName}`
    : t("admin.bo.common.employee");
  const initials = initialsOf(item.user?.firstName, item.user?.lastName);
  const busy = approve.isPending || revoke.isPending;

  if (done !== null) return <Resolved name={name} approved={done} />;

  const onApprove = () =>
    approve.mutate(item.id, {
      onSuccess: () => {
        setDone(true);
        feedback.success(t("admin.bo.valider.deviceApproved"), name);
      },
      onError: () => feedback.error(t("admin.bo.common.failed")),
    });

  const onReject = () =>
    Alert.alert(
      t("admin.bo.valider.deviceRejectConfirm"),
      t("admin.bo.valider.deviceRejectMessage", { name }),
      [
        { text: t("admin.bo.common.cancel"), style: "cancel" },
        {
          text: t("admin.bo.valider.reject"),
          style: "destructive",
          onPress: () =>
            revoke.mutate(item.id, {
              onSuccess: () => setDone(false),
              onError: () => feedback.error(t("admin.bo.common.failed")),
            }),
        },
      ],
    );

  return (
    <ApprovalShell
      name={name}
      initials={initials}
      dept={item.user?.site?.name ?? item.platform}
      typeLabel={item.platform}
      typeTone="primary"
    >
      <InfoBox
        icon="cpu"
        line1={item.deviceName}
        line2={
          item.lastUsedAt
            ? t("admin.bo.valider.lastUsed", { date: fmtDay(item.lastUsedAt) })
            : t("admin.bo.valider.newDevice")
        }
      />
      <ActionRow pending={busy} onApprove={onApprove} onReject={onReject} />
    </ApprovalShell>
  );
}

function PhotoCompare({
  label,
  uri,
  highlight,
  onPress,
}: {
  label: string;
  uri: string | null;
  highlight?: boolean;
  onPress?: () => void;
}) {
  const p = useAdminTheme();
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text
        style={{
          fontFamily: FONT.bold,
          fontSize: 10.5,
          color: p.muted2,
          textTransform: "uppercase",
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
      {uri ? (
        <Pressable onPress={onPress}>
          <Image
            source={{ uri }}
            style={{
              width: "100%",
              height: 150,
              borderRadius: RADIUS.base,
              borderWidth: highlight ? 2 : 1,
              borderColor: highlight ? p.primary : p.line,
              backgroundColor: p.surface2,
            }}
          />
          <View
            style={{
              position: "absolute",
              right: 6,
              bottom: 6,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AdminIcon name="search" size={13} color="#fff" />
          </View>
        </Pressable>
      ) : (
        <View
          style={{
            width: "100%",
            height: 150,
            borderRadius: RADIUS.base,
            borderWidth: 1,
            borderColor: p.line,
            backgroundColor: p.surface2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AdminIcon name="user" size={28} color={p.muted2} />
        </View>
      )}
    </View>
  );
}

function PhotoCard({ item }: { item: PhotoRequest }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const approve = useApprovePhotoRequest();
  const reject = useRejectPhotoRequest();
  const [done, setDone] = useState<null | boolean>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const name = `${item.firstName} ${item.lastName}`;
  const initials = initialsOf(item.firstName, item.lastName);
  const busy = approve.isPending || reject.isPending;
  const current = buildPhotoUrl(item.photoUrl);
  const next = buildPhotoUrl(item.newPhotoUrl);

  if (done !== null) return <Resolved name={name} approved={done} />;

  const onApprove = () =>
    approve.mutate(item.id, {
      onSuccess: () => {
        setDone(true);
        feedback.success(t("admin.bo.valider.photoApproved"), name);
      },
      onError: () => feedback.error(t("admin.bo.common.failed")),
    });

  const onReject = () =>
    Alert.alert(
      t("admin.bo.valider.photoRejectConfirm"),
      t("admin.bo.valider.photoRejectMessage", { name }),
      [
        { text: t("admin.bo.common.cancel"), style: "cancel" },
        {
          text: t("admin.bo.valider.reject"),
          style: "destructive",
          onPress: () =>
            reject.mutate(item.id, {
              onSuccess: () => setDone(false),
              onError: () => feedback.error(t("admin.bo.common.failed")),
            }),
        },
      ],
    );

  return (
    <ApprovalShell
      name={name}
      initials={initials}
      dept={item.email}
      typeLabel={t("admin.bo.valider.photoTag")}
      typeTone="warning"
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <PhotoCompare
          label={t("admin.bo.valider.photoCurrent")}
          uri={current}
          onPress={() => current && setPreview(current)}
        />
        <AdminIcon name="chevron" size={18} color={p.muted2} />
        <PhotoCompare
          label={t("admin.bo.valider.photoNew")}
          uri={next}
          highlight
          onPress={() => next && setPreview(next)}
        />
      </View>
      <ActionRow pending={busy} onApprove={onApprove} onReject={onReject} />

      <Sheet open={!!preview} onClose={() => setPreview(null)}>
        {preview ? (
          <View style={{ gap: 12 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 18, color: p.ink }}>{name}</Text>
            <Image
              source={{ uri: preview }}
              resizeMode="contain"
              style={{ width: "100%", height: 360, borderRadius: RADIUS.base, backgroundColor: p.surface2 }}
            />
          </View>
        ) : null}
      </Sheet>
    </ApprovalShell>
  );
}
