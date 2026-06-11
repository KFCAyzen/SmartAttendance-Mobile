import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import Toast from "react-native-toast-message";

import type { AdminEmployee } from "~/api/admin";
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
import { useEmployees } from "~/hooks/useAdminData";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  HR: "Ressources humaines",
  MANAGER: "Manager",
  EMPLOYEE: "Employé",
};

export default function TeamScreen() {
  const p = useAdminTheme();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [selected, setSelected] = useState<AdminEmployee | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const query = useEmployees(search, dept === "all" ? undefined : dept);
  const items = useMemo(
    () => (query.data?.pages ?? []).flatMap((pg) => pg.data ?? pg.items ?? []),
    [query.data],
  );

  const depts = useMemo(() => {
    const set = new Set<string>();
    items.forEach((e) => e.department && set.add(e.department));
    return ["all", ...Array.from(set)];
  }, [items]);

  const chips = depts.map((d) => ({ key: d, label: d === "all" ? "Tous" : d }));

  return (
    <>
      <AdminScrollBody gap={12}>
        <AdminHeader
          sub={`${query.data?.pages?.[0]?.meta?.total ?? items.length} employés`}
          title="Équipe"
          right={<IconBtn icon="plus" tone="primary" onPress={() => setAddOpen(true)} />}
        />
        <SearchBar placeholder="Nom ou poste…" value={search} onChange={setSearch} />
        <FilterChips options={chips} value={dept} onChange={setDept} />

        {query.isLoading ? (
          <View style={{ paddingTop: 50, alignItems: "center" }}>
            <ActivityIndicator color={p.primary} />
          </View>
        ) : items.length === 0 ? (
          <Card soft pad={20}>
            <Text style={{ fontFamily: FONT.body, fontSize: 13, color: p.muted, textAlign: "center" }}>
              Aucun employé trouvé.
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
                  role: e.position ?? ROLE_LABEL[e.role] ?? e.role,
                  dept: e.department ?? "—",
                }}
                onPress={() => setSelected(e)}
                right={
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                    {e.isPending ? (
                      <Pill tone="warning" dot>
                        En attente
                      </Pill>
                    ) : e.isActive ? (
                      <Pill tone="success" dot>
                        Actif
                      </Pill>
                    ) : (
                      <Pill tone="neutral" dot>
                        Inactif
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
                    Charger plus
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
          onSubmit={() => {
            setAddOpen(false);
            Toast.show({
              type: "info",
              text1: "Bientôt disponible",
              text2: "La création d'employé nécessite un endpoint backend.",
            });
          }}
        />
      </Sheet>
    </>
  );
}

function EmpDetail({ emp }: { emp: AdminEmployee }) {
  const p = useAdminTheme();
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
            {emp.position ?? ROLE_LABEL[emp.role] ?? emp.role}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 7 }}>
            {emp.department ? <Pill tone="neutral">{emp.department}</Pill> : null}
            {emp.isPending ? (
              <Pill tone="warning">En attente</Pill>
            ) : (
              <Pill tone="success">Actif</Pill>
            )}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 9 }}>
        {[
          ["Rôle", ROLE_LABEL[emp.role] ?? emp.role],
          ["Équipe", emp.team?.name ?? "—"],
          ["Pointages", String(emp._count?.attendances ?? 0)],
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
  onSubmit,
}: {
  departments: string[];
  onSubmit: () => void;
}) {
  const p = useAdminTheme();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [position, setPosition] = useState("");
  const [dept, setDept] = useState(departments[0] ?? "");
  const [role, setRole] = useState("EMPLOYEE");

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
      <Text style={{ fontFamily: FONT.display, fontSize: 21, color: p.ink }}>Nouvel employé</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {field("Prénom", first, setFirst, "Salim")}
        {field("Nom", last, setLast, "Mansouri")}
      </View>
      {field("Poste", position, setPosition, "Ingénieur logiciel")}

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
            Département
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
          Rôle d&apos;accès
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 9 }}>
          {[
            ["EMPLOYEE", "Employé"],
            ["MANAGER", "Manager"],
            ["HR", "RH"],
          ].map(([k, lbl]) => {
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
          Une invitation au pointage facial sera envoyée par e-mail.
        </Text>
      </View>

      <Pressable
        onPress={onSubmit}
        style={{
          backgroundColor: p.primary,
          borderRadius: RADIUS.base,
          paddingVertical: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: "#fff" }}>Ajouter &amp; inviter</Text>
      </Pressable>
    </View>
  );
}
