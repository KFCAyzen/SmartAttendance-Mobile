import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import type { AdminEmployee } from "~/api/admin";
import { feedback } from "~/components/feedback";
import { AdminIcon } from "~/components/admin/AdminIcon";
import { initialsOf } from "~/components/admin/format";
import {
  AdminHeader,
  AdminScrollBody,
  Card,
  DataRow,
  EmpAvatar,
  FilterChips,
  IconBtn,
  Pill,
  SearchBar,
} from "~/components/admin/primitives";
import { Sheet } from "~/components/admin/Sheet";
import { FONT, RADIUS, withAlpha } from "~/components/admin/theme";
import { useAdminTheme } from "~/components/admin/useAdminTheme";
import { useCreateEmployee, useEmployeeDepartments, useEmployees } from "~/hooks/useAdminData";
import { useAuthStore } from "~/stores/auth.store";

export default function TeamScreen() {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [selected, setSelected] = useState<AdminEmployee | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const query = useEmployees(search, dept === "all" ? undefined : dept);
  const departmentsQuery = useEmployeeDepartments(search);
  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((pg) => pg.data ?? pg.items ?? []),
    [query.data],
  );

  const depts = useMemo(() => {
    const set = new Set<string>(departmentsQuery.data);
    items.forEach((employee) => {
      if (employee.department) set.add(employee.department);
    });
    if (dept !== "all") set.add(dept);
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [departmentsQuery.data, dept, items]);

  const chips = depts.map((d) => ({ key: d, label: d === "all" ? t("admin.bo.equipe.all") : d }));

  return (
    <>
      <AdminScrollBody gap={12}>
        <AdminHeader
          backLabel={t("admin.bo.nav.more")}
          sub={t("admin.bo.equipe.count", { count: query.data?.pages?.[0]?.meta?.total ?? items.length })}
          title={t("admin.bo.equipe.title")}
          right={<IconBtn icon="plus" tone="primary" onPress={() => setAddOpen(true)} />}
        />
        <SearchBar placeholder={t("admin.bo.equipe.search")} value={search} onChange={setSearch} />
        <FilterChips options={chips} value={dept} onChange={setDept} />

        {query.isLoading ? (
          <View style={{ paddingTop: 50, alignItems: "center" }}>
            <ActivityIndicator color={p.primary} />
          </View>
        ) : items.length === 0 ? (
          <Card soft pad={20}>
            <Text style={{ fontFamily: FONT.body, fontSize: 13, color: p.muted, textAlign: "center" }}>
              {t("admin.bo.equipe.noResults")}
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {items.map((e) => (
              <DataRow
                key={e.id}
                emp={{
                  first: e.firstName,
                  last: e.lastName,
                  initials: initialsOf(e.firstName, e.lastName),
                  role: e.position ?? t(`admin.bo.roleLabels.${e.role}`),
                  dept: e.department ?? "—",
                }}
                onPress={() => setSelected(e)}
                right={
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                    {e.isPending ? (
                      <Pill tone="warning" dot>
                        {t("admin.bo.equipe.pending")}
                      </Pill>
                    ) : e.isActive ? (
                      <Pill tone="success" dot>
                        {t("admin.bo.equipe.active")}
                      </Pill>
                    ) : (
                      <Pill tone="neutral" dot>
                        {t("admin.bo.equipe.inactive")}
                      </Pill>
                    )}
                    <AdminIcon name="chevron" size={17} color={p.muted2} />
                  </View>
                }
              />
            ))}
            {query.hasNextPage ? (
              <Card soft pad={0} onPress={() => query.fetchNextPage()} style={{ paddingVertical: 13, alignItems: "center" }}>
                {query.isFetchingNextPage ? (
                  <ActivityIndicator color={p.primary} />
                ) : (
                  <Text style={{ fontFamily: FONT.bold, fontSize: 13.5, color: p.primary }}>
                    {t("admin.bo.equipe.loadMore")}
                  </Text>
                )}
              </Card>
            ) : null}
          </View>
        )}
      </AdminScrollBody>

      <Sheet open={!!selected} onClose={() => setSelected(null)}>
        {selected ? <EmpDetail emp={selected} /> : null}
      </Sheet>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)}>
        <AddEmployeeForm
          departments={depts.filter((d) => d !== "all")}
          onDone={() => setAddOpen(false)}
        />
      </Sheet>
    </>
  );
}

function EmpDetail({ emp }: { emp: AdminEmployee }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const name = `${emp.firstName} ${emp.lastName}`;
  const contacts: { icon: string; value: string }[] = [
    { icon: "mail", value: emp.email },
    ...(emp.phone ? [{ icon: "phone", value: emp.phone }] : []),
    ...(emp.site?.name ? [{ icon: "location", value: emp.site.name }] : []),
  ];

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <EmpAvatar name={name} initials={initialsOf(emp.firstName, emp.lastName)} size={58} radius={19} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 20, color: p.ink }}>{name}</Text>
          <Text style={{ fontFamily: FONT.body, fontSize: 13, color: p.muted }}>
            {emp.position ?? t(`admin.bo.roleLabels.${emp.role}`)}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 7 }}>
            {emp.department ? <Pill tone="neutral">{emp.department}</Pill> : null}
            {emp.isPending ? (
              <Pill tone="warning">{t("admin.bo.equipe.pending")}</Pill>
            ) : (
              <Pill tone="success">{t("admin.bo.equipe.active")}</Pill>
            )}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 9 }}>
        {[
          [t("admin.bo.equipe.role"), t(`admin.bo.roleLabels.${emp.role}`)],
          [t("admin.bo.equipe.team"), emp.team?.name ?? "—"],
          [t("admin.bo.equipe.checkins"), String(emp._count?.attendances ?? 0)],
        ].map(([l, v]) => (
          <View
            key={l}
            style={{
              flex: 1,
              backgroundColor: p.surface2,
              borderWidth: 1,
              borderColor: p.line,
              borderRadius: RADIUS.base,
              padding: 12,
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={{
                fontFamily: FONT.bold,
                fontSize: 10.5,
                color: p.muted2,
                textTransform: "uppercase",
                letterSpacing: 0.2,
              }}
            >
              {l}
            </Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 16, color: p.ink, marginTop: 3 }} numberOfLines={1}>
              {v}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 9 }}>
        {contacts.map((c) => (
          <View
            key={c.icon}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 11,
              padding: 12,
              paddingHorizontal: 14,
              backgroundColor: p.surface2,
              borderRadius: RADIUS.base,
              borderWidth: 1,
              borderColor: p.line,
            }}
          >
            <AdminIcon name={c.icon} size={17} color={p.primary} />
            <Text style={{ flex: 1, fontFamily: FONT.medium, fontSize: 13.5, color: p.ink }} numberOfLines={1}>
              {c.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AddEmployeeForm({
  departments,
  onDone,
}: {
  departments: string[];
  onDone: () => void;
}) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const create = useCreateEmployee();
  const myRole = useAuthStore((s) => s.user?.role);
  // Côté serveur, seul un ADMIN peut créer des comptes HR/ADMIN ; on masque ces options aux HR.
  const roleOptions = (
    myRole === "ADMIN"
      ? ([
          ["EMPLOYEE", t("admin.bo.equipe.roleEmployee")],
          ["HR", t("admin.bo.equipe.roleHR")],
          ["ADMIN", t("admin.bo.equipe.roleAdmin")],
        ] as const)
      : ([["EMPLOYEE", t("admin.bo.equipe.roleEmployee")]] as const)
  );
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [dept, setDept] = useState(departments[0] ?? "");
  const [role, setRole] = useState<"EMPLOYEE" | "HR" | "ADMIN">("EMPLOYEE");

  const submit = () => {
    if (!first.trim() || !last.trim() || !email.trim()) {
      feedback.error(t("admin.bo.common.requiredFields"), t("admin.bo.equipe.requiredMsg"));
      return;
    }
    create.mutate(
      {
        firstName: first.trim(),
        lastName: last.trim(),
        email: email.trim(),
        position: position.trim() || undefined,
        department: dept || undefined,
        role,
      },
      {
        onSuccess: (u) => {
          onDone();
          feedback.toast({
            type: "success",
            title: t("admin.bo.equipe.createdTitle"),
            message: t("admin.bo.equipe.tempPassword", { pwd: u.tempPassword }),
            duration: 8000,
          });
        },
        onError: (e: any) => {
          feedback.error(
            t("admin.bo.common.createFailed"),
            e?.response?.data?.message ?? t("admin.bo.common.tryAgain"),
          );
        },
      },
    );
  };

  const field = (
    label: string,
    value: string,
    setter: (v: string) => void,
    placeholder: string,
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
      <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>{t("admin.bo.equipe.newEmployee")}</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {field(t("admin.bo.equipe.firstName"), first, setFirst, "Salim")}
        {field(t("admin.bo.equipe.lastName"), last, setLast, "Mansouri")}
      </View>
      {field(t("admin.bo.equipe.email"), email, setEmail, "salim@exemple.com")}
      {field(t("admin.bo.equipe.position"), position, setPosition, t("admin.bo.equipe.positionPlaceholder"))}

      {departments.length ? (
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
            {t("admin.bo.equipe.department")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
            {departments.map((d) => {
              const on = dept === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDept(d)}
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
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

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
          {t("admin.bo.equipe.accessRole")}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 9 }}>
          {roleOptions.map(([k, lbl]) => {
            const on = role === k;
            return (
              <Pressable
                key={k}
                onPress={() => setRole(k)}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: on ? p.primary : p.line,
                  backgroundColor: on ? withAlpha(p.primary, 0.12) : p.surface2,
                  borderRadius: RADIUS.base,
                  paddingVertical: 11,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontFamily: FONT.bold, fontSize: 13, color: on ? p.primary : p.muted }}>
                  {lbl}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
        <AdminIcon name="sparkle" size={16} color={p.primary} />
        <Text style={{ flex: 1, fontFamily: FONT.semibold, fontSize: 12.5, color: p.primary }}>
          {t("admin.bo.equipe.inviteInfo")}
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
          <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: "#fff" }}>{t("admin.bo.equipe.addInvite")}</Text>
        )}
      </Pressable>
    </View>
  );
}
