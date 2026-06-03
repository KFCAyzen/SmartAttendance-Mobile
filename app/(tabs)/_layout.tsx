import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { CustomTabBar } from "~/components/ui/CustomTabBar";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="historique" options={{ title: t("tabs.history") }} />
      <Tabs.Screen name="pointage" options={{ title: t("tabs.checkin") }} />
      <Tabs.Screen name="demandes" options={{ title: t("tabs.requests") }} />
      <Tabs.Screen name="profile" options={{ title: t("tabs.profile") }} />
      {/* Admin reste une route mais hors tab bar (accès via Profil) → scan centré. */}
      <Tabs.Screen name="admin" options={{ title: t("tabs.admin"), href: null }} />
    </Tabs>
  );
}
