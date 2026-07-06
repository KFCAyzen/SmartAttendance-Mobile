import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, Switch, Text, TextInput, View } from "react-native";

import type { AdminTeam } from "~/api/admin";
import { humanizeApiError } from "~/api/client";
import { AdminIcon } from "~/components/admin/AdminIcon";
import { initialsOf } from "~/components/admin/format";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  EmpAvatar,
  IconBtn,
  Pill,
  SearchBar,
} from "~/components/admin/primitives";
import { Sheet } from "~/components/admin/Sheet";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { feedback } from "~/components/feedback";
import {
  useCreateTeam,
  useDeleteTeam,
  useEmployees,
  useTeams,
  useUpdateTeam,
} from "~/hooks/useAdminData";
import { useAuthStore } from "~/stores/auth.store";

export default function TeamsScreen() {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const teams = useTeams();
  const [addOpen, setAddOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<AdminTeam | null>(null);

  const list = teams.data ?? [];

  return (
    <>
      <AdminScrollBody gap={12} refreshing={teams.isRefetching} onRefresh={() => teams.refetch()}>
        <AdminHeader
          backLabel={t("admin.bo.nav.more")}
          sub={t("admin.bo.equipes.sub")}
          title={t("admin.bo.equipes.title")}
          right={<IconBtn icon="plus" tone="primary" onPress={() => setAddOpen(true)} />}
        />

        {teams.isLoading ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator color={p.primary} />
          </View>
        ) : list.length === 0 ? (
          <Card soft style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>
              {t("admin.bo.equipes.none")}
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 11 }}>
            {list.map((team) => (
              <Card key={team.id} style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      backgroundColor: withAlpha(p.primary, 0.12),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AdminIcon name="users" size={22} color={p.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: FONT.display, fontSize: 16.5, color: p.ink }}>{team.name}</Text>
                    {team.description ? (
                      <Text numberOfLines={2} style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted, marginTop: 2 }}>
                        {team.description}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      <Pill tone="neutral">
                        {t("admin.bo.equipes.members", { count: team._count?.members ?? 0 })}
                      </Pill>
                      {team.manager ? (
                        <Pill tone="accent">
                          {t("admin.bo.equipes.managedBy", {
                            name: `${team.manager.firstName} ${team.manager.lastName}`,
                          })}
                        </Pill>
                      ) : null}
                      {team.isActive === false ? <Pill tone="neutral">{t("admin.bo.equipes.inactive")}</Pill> : null}
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 9 }}>
                  <CardActionBtn icon="edit" label={t("admin.bo.equipes.editBtn")} onPress={() => setEditTeam(team)} />
                </View>
              </Card>
            ))}
          </View>
        )}
      </AdminScrollBody>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
        <TeamForm onDone={() => setAddOpen(false)} />
      </Sheet>

      <Sheet open={!!editTeam} onClose={() => setEditTeam(null)}>
        {editTeam ? <TeamForm team={editTeam} onDone={() => setEditTeam(null)} /> : null}
      </Sheet>
    </>
  );
}

function TeamForm({ team, onDone }: { team?: AdminTeam; onDone: () => void }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const editing = !!team;
  const isAdmin = useAuthStore((s) => s.user?.role === "ADMIN");
  const create = useCreateTeam();
  const update = useUpdateTeam();
  const del = useDeleteTeam();
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [managerId, setManagerId] = useState<string | null>(team?.managerId ?? null);
  const [managerName, setManagerName] = useState(
    team?.manager ? `${team.manager.firstName} ${team.manager.lastName}` : "",
  );
  const [active, setActive] = useState(team?.isActive ?? true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pending = create.isPending || update.isPending || del.isPending;

  const onError = (e: any) =>
    feedback.error(
      t("admin.bo.common.createFailed"),
      humanizeApiError(e),
    );

  const submit = () => {
    if (!name.trim()) {
      feedback.error(t("admin.bo.common.requiredFields"), t("admin.bo.equipes.requiredMsg"));
      return;
    }
    const base = {
      name: name.trim(),
      description: description.trim() || null,
      managerId: managerId || null,
    };
    if (editing) {
      update.mutate(
        { id: team!.id, input: { ...base, isActive: active } },
        {
          onSuccess: () => {
            onDone();
            feedback.success(t("admin.bo.equipes.updatedTitle"), name.trim());
          },
          onError,
        },
      );
      return;
    }
    create.mutate(base, {
      onSuccess: () => {
        onDone();
        feedback.success(t("admin.bo.equipes.createdTitle"), name.trim());
      },
      onError,
    });
  };

  const onDelete = () =>
    Alert.alert(
      t("admin.bo.equipes.deleteConfirm"),
      t("admin.bo.equipes.deleteMessage", { name: team?.name ?? "" }),
      [
        { text: t("admin.bo.common.cancel"), style: "cancel" },
        {
          text: t("admin.bo.common.delete"),
          style: "destructive",
          onPress: () =>
            del.mutate(team!.id, {
              onSuccess: () => {
                onDone();
                feedback.success(t("admin.bo.equipes.deleteSuccess"), team?.name ?? "");
              },
              onError,
            }),
        },
      ],
    );

  const labelStyle = {
    fontFamily: FONT.bold,
    fontSize: 11.5,
    color: p.muted,
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
  };
  const inputStyle = {
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
  };

  return (
    <View style={{ gap: 15 }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>
        {editing ? t("admin.bo.equipes.editTeam") : t("admin.bo.equipes.newTeam")}
      </Text>

      <View>
        <Text style={labelStyle}>{t("admin.bo.equipes.name")}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("admin.bo.equipes.namePlaceholder")}
          placeholderTextColor={p.muted2}
          style={inputStyle}
        />
      </View>

      <View>
        <Text style={labelStyle}>{t("admin.bo.equipes.description")}</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t("admin.bo.equipes.descriptionPlaceholder")}
          placeholderTextColor={p.muted2}
          multiline
          style={{ ...inputStyle, minHeight: 70, textAlignVertical: "top" }}
        />
      </View>

      <View>
        <Text style={labelStyle}>{t("admin.bo.equipes.manager")}</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={{
            ...inputStyle,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Text style={{ flex: 1, fontFamily: FONT.medium, fontSize: 14, color: managerName ? p.ink : p.muted2 }}>
            {managerName || t("admin.bo.equipes.chooseManager")}
          </Text>
          {managerId ? (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setManagerId(null);
                setManagerName("");
              }}
            >
              <AdminIcon name="xmark" size={16} color={p.muted2} />
            </Pressable>
          ) : null}
          <AdminIcon name="chevron" size={16} color={p.primary} />
        </Pressable>
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
            <Text style={{ fontFamily: FONT.bold, fontSize: 13.5, color: p.ink }}>{t("admin.bo.equipes.activeLabel")}</Text>
            <Text style={{ fontFamily: FONT.body, fontSize: 11.5, color: p.muted, marginTop: 2 }}>
              {t("admin.bo.equipes.activeHint")}
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
            {editing ? t("admin.bo.equipes.save") : t("admin.bo.equipes.create")}
          </Text>
        )}
      </Pressable>

      {editing && isAdmin ? (
        <Pressable
          onPress={pending ? undefined : onDelete}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: RADIUS.base,
            borderWidth: 1,
            borderColor: withAlpha(p.danger, 0.35),
            backgroundColor: withAlpha(p.danger, 0.1),
          }}
        >
          <AdminIcon name="trash" size={16} color={p.danger} />
          <Text style={{ fontFamily: FONT.bold, fontSize: 14.5, color: p.danger }}>
            {t("admin.bo.common.delete")}
          </Text>
        </Pressable>
      ) : null}

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)}>
        <ManagerPicker
          onPick={(id, fullName) => {
            setManagerId(id);
            setManagerName(fullName);
            setPickerOpen(false);
          }}
        />
      </Sheet>
    </View>
  );
}

function ManagerPicker({ onPick }: { onPick: (id: string, name: string) => void }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const employees = useEmployees(search);
  const rows = useMemo(
    () => employees.data?.pages.flatMap((pg) => pg.data ?? pg.items ?? []) ?? [],
    [employees.data],
  );

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>
        {t("admin.bo.equipes.managerPickerTitle")}
      </Text>
      <SearchBar placeholder={t("admin.bo.equipes.managerSearch")} value={search} onChange={setSearch} />

      {employees.isLoading && rows.length === 0 ? (
        <View style={{ paddingVertical: 30, alignItems: "center" }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : rows.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>{t("admin.bo.equipes.noResults")}</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {rows.map((emp) => (
            <Pressable
              key={emp.id}
              onPress={() => onPick(emp.id, `${emp.firstName} ${emp.lastName}`)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 11,
                paddingHorizontal: 13,
                borderRadius: RADIUS.base,
                borderWidth: 1,
                borderColor: p.line,
                backgroundColor: p.surface,
              }}
            >
              <EmpAvatar name={`${emp.firstName} ${emp.lastName}`} initials={initialsOf(emp.firstName, emp.lastName)} size={38} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 14, color: p.ink }}>
                  {emp.firstName} {emp.lastName}
                </Text>
                <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 11.5, color: p.muted }}>
                  {emp.position || emp.department || emp.email}
                </Text>
              </View>
            </Pressable>
          ))}
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
      <AdminIcon name={icon} size={15} color={p.primary} />
      <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: p.ink }}>{label}</Text>
    </Pressable>
  );
}
