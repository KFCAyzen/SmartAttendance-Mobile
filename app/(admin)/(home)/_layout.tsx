import { Tabs } from "expo-router";

import { AdminTabBar } from "~/components/admin/AdminTabBar";

export default function AdminHomeLayout() {
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
    </Tabs>
  );
}
