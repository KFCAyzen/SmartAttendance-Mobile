import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAdminTheme } from "./useAdminTheme";

/** Panneau bas (port de SheetA) : overlay sombre + feuille arrondie en haut. */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const p = useAdminTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(8,11,20,0.45)", justifyContent: "flex-end" }}
      >
        {/* Fait monter la feuille au-dessus du clavier (edge-to-edge : pas
            d'adjustResize, la compensation doit se faire en JS). Le plafond de
            hauteur vit ici : le parent du KAV est le seul à avoir une hauteur
            déterminée (plein écran), un % sur la feuille serait sans effet. */}
        <KeyboardAvoidingView behavior="padding" style={{ maxHeight: "84%" }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: p.surface,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            paddingTop: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 5,
              borderRadius: 999,
              backgroundColor: p.line,
              alignSelf: "center",
              marginBottom: 14,
            }}
          />
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: Math.max(insets.bottom, 20) + 10,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
