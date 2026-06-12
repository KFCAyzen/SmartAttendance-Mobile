import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import type { AdminAbsence, AdminLeave } from "~/api/admin";
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
import { initialsOf } from "~/components/admin/format";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import i18n from "~/i18n";
import {
  useAdminActions,
  usePendingAbsences,
  usePendingLeaves,
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

export default function ValidationScreen() {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"leave" | "absence">("leave");
  const leaves = usePendingLeaves();
  const absences = usePendingAbsences();

  const leaveItems = (leaves.data?.pages ?? []).flatMap((pg) => pg.data ?? pg.items ?? []);
  const absenceItems = (absences.data?.pages ?? []).flatMap((pg) => pg.data ?? pg.items ?? []);

  const loading = tab === "leave" ? leaves.isLoading : absences.isLoading;
  const items = tab === "leave" ? leaveItems : absenceItems;

  return (
    <AdminScrollBody gap={12}>
      <AdminHeader sub={t("admin.bo.valider.sub")} title={t("admin.bo.valider.title")} />
      <Segmented
        value={tab}
        onChange={(k) => setTab(k as "leave" | "absence")}
        options={[
          { key: "leave", label: t("admin.bo.valider.leaves"), count: leaveItems.length },
          { key: "absence", label: t("admin.bo.valider.absences"), count: absenceItems.length },
        ]}
      />

      {loading ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : items.length === 0 ? (
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
            : absenceItems.map((it) => <AbsenceCard key={it.id} item={it} />)}
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
