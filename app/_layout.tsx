import "../global.css";

import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { setUnauthorizedHandler } from "~/api/client";
import { AnimatedSplash } from "~/components/AnimatedSplash";
import { Providers } from "~/components/Providers";
import { FeedbackProvider } from "~/components/feedback";
import { useAuthStore } from "~/stores/auth.store";

export const unstable_settings = {
  anchor: "(tabs)",
};

void SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { i18n } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const status = useAuthStore((s) => s.status);
  const isAdmin = useAuthStore((s) => s.user?.role === "ADMIN" || s.user?.role === "HR");
  const hydrate = useAuthStore((s) => s.hydrate);
  const navState = useRootNavigationState();
  const navReady = Boolean(navState?.key);
  const [splashFinished, setSplashFinished] = useState(false);

  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // L'app est prête quand les polices sont chargées et la session résolue.
  // Le splash animé (qui contrôle le hand-off depuis le splash natif) reste
  // affiché tant que ce n'est pas le cas et que sa séquence n'est pas terminée.
  const appReady =
    fontsLoaded && status !== "idle" && status !== "loading";

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().clearSession();
      router.replace("/(auth)/login");
    });
  }, [router]);

  useEffect(() => {
    if (
      !navReady ||
      status === "idle" ||
      status === "loading" ||
      status === "verifying_device"
    )
      return;
    const inAuthGroup = segments[0] === "(auth)";
    const inAdminGroup = segments[0] === "(admin)";
    const inTabsGroup = segments[0] === "(tabs)";
    const currentRoute = segments.join("/");
    const home = isAdmin ? "/(admin)/(home)" : "/(tabs)";
    // device-pending requires a live session, so a logout there must fall back to
    // login (it lives in (auth), so the inAuthGroup guard alone would strand it).
    const onDevicePending = currentRoute === "(auth)/device-pending";
    if (status === "unauthenticated" && (!inAuthGroup || onDevicePending)) {
      router.replace("/(auth)/login");
    } else if (
      (status === "device_pending" || status === "device_error") &&
      currentRoute !== "(auth)/device-pending"
    ) {
      router.replace("/(auth)/device-pending");
    } else if (status === "authenticated") {
      // Aiguillage par rôle : admins/RH → back-office, employés → app.
      if (inAuthGroup) {
        router.replace(home);
      } else if (isAdmin && inTabsGroup) {
        router.replace("/(admin)/(home)");
      } else if (!isAdmin && inAdminGroup) {
        router.replace("/(tabs)");
      }
    }
  }, [navReady, status, isAdmin, segments, router]);

  if (!fontsLoaded) {
    // Splash natif reste affiché tant que les polices ne sont pas chargées.
    return null;
  }

  // Le contenu de l'app se monte sous le splash animé dès que les polices sont
  // prêtes ; le splash le recouvre jusqu'à la fin de sa séquence.
  const body =
    status === "idle" || status === "loading" ? (
      <View className="flex-1 items-center justify-center bg-surface-light dark:bg-surface-dark">
        <ActivityIndicator color="#2F5BFF" />
      </View>
    ) : (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Providers>
          <FeedbackProvider>
            {/* La key sur la langue remonte tout l'arbre de navigation au changement
                de langue : les écrans à onglets gelés/détachés (qui ratent l'event
                languageChanged) sont reconstruits dans la nouvelle langue. */}
            <Stack key={i18n.language}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
          </FeedbackProvider>
        </Providers>
        <StatusBar style="auto" />
      </ThemeProvider>
    );

  return (
    <>
      {body}
      {!splashFinished ? (
        <AnimatedSplash
          appReady={appReady}
          onFinish={() => setSplashFinished(true)}
        />
      ) : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}
