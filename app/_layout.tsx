import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { setUnauthorizedHandler } from "~/api/client";
import { Providers } from "~/components/Providers";
import { useAuthStore } from "~/stores/auth.store";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const navState = useRootNavigationState();
  const navReady = Boolean(navState?.key);

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
    const currentRoute = segments.join("/");
    if (status === "unauthenticated" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (
      (status === "device_pending" || status === "device_error") &&
      currentRoute !== "(auth)/device-pending"
    ) {
      router.replace("/(auth)/device-pending");
    } else if (status === "authenticated" && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [navReady, status, segments, router]);

  if (status === "idle" || status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-surface-light dark:bg-surface-dark">
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Providers>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </Providers>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <>
      <RootLayoutNav />
      <Toast />
    </>
  );
}
