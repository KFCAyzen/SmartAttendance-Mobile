import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Ordre d'affichage souhaité (le reste est rejeté en fin de liste). */
const ORDER = ['index', 'historique', 'pointage', 'demandes', 'profile', 'admin'];

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: 'home', off: 'home-outline' },
  historique: { on: 'time', off: 'time-outline' },
  demandes: { on: 'document-text', off: 'document-text-outline' },
  profile: { on: 'person', off: 'person-outline' },
  admin: { on: 'shield-checkmark', off: 'shield-checkmark-outline' },
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Pointage = écran immersif plein écran (caméra) → pas de tab bar (cf. maquette).
  if (state.routes[state.index]?.name === 'pointage') return null;

  // Routes visibles (href:null masque l'onglet, ex. admin pour un non-admin),
  // triées dans l'ordre voulu.
  const routes = state.routes
    .filter((r) => (descriptors[r.key].options as { href?: string | null }).href !== null)
    .sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));

  return (
    <View
      className="flex-row items-start justify-around border-t border-black/5 bg-surface-card px-2 pt-2.5 dark:border-white/10 dark:bg-surface-cardDark"
      style={{
        paddingBottom: Math.max(insets.bottom, 12),
        shadowColor: '#0E1326',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -8 },
      }}
    >
      {routes.map((route) => {
        const { options } = descriptors[route.key];
        const focused = state.routes[state.index].key === route.key;
        const label =
          typeof options.title === 'string' ? options.title : route.name;

        const onPress = () => {
          if (process.env.EXPO_OS === 'ios') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Bouton central « Pointage » surélevé.
        if (route.name === 'pointage') {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              className="items-center"
              style={{ marginTop: -34 }}
            >
              <LinearGradient
                colors={['#2F5BFF', '#2140B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 62,
                  width: 62,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 22,
                  transform: [{ translateY: focused ? -2 : 0 }],
                  shadowColor: '#2F5BFF',
                  shadowOpacity: 0.42,
                  shadowRadius: 22,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 10,
                }}
              >
                <Ionicons name="scan" size={28} color="#fff" />
              </LinearGradient>
            </Pressable>
          );
        }

        const icon = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            className="flex-1 items-center gap-[5px] py-1"
          >
            <Ionicons
              name={focused ? icon.on : icon.off}
              size={24}
              color={focused ? '#2F5BFF' : '#717A90'}
            />
            <Text
              className={`text-[10.5px] ${
                focused ? 'font-bodyBold text-primary' : 'font-bodySemibold text-muted'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
