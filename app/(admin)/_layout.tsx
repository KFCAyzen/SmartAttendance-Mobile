import { Stack } from "expo-router";

// Le groupe `(home)` (barre d'onglets) est l'ancre du back-office ; les écrans
// secondaires (équipe, sites, fiche employé…) sont des écrans empilés → push/pop
// natif + geste de retour par balayage du bord gauche sur iOS.
export const unstable_settings = { anchor: "(home)" };

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        // iOS : autorise le balayage sur tout l'écran (pas seulement le bord).
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
