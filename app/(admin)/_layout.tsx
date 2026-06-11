import { Tabs } from "expo-router";

import { AdminTabBar } from "~/components/admin/AdminTabBar";

export default function AdminLayout() {
  return (
    <Tabs
      tabBar={(props) => <AdminTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Bord" }} />
      <Tabs.Screen name="presence" options={{ title: "Présence" }} />
      <Tabs.Screen name="pointage" options={{ title: "Pointer" }} />
      <Tabs.Screen name="valider" options={{ title: "Valider" }} />
      <Tabs.Screen name="plus" options={{ title: "Plus" }} />
      {/* Atteints via le hub « Plus » → masqués de la barre. */}
      <Tabs.Screen name="equipe" options={{ title: "Équipe", href: null }} />
      <Tabs.Screen name="planning" options={{ title: "Planning", href: null }} />
      <Tabs.Screen name="reports" options={{ title: "Rapports", href: null }} />
      <Tabs.Screen name="sites" options={{ title: "Sites", href: null }} />
      <Tabs.Screen name="roles" options={{ title: "Rôles", href: null }} />
    </Tabs>
  );
}
