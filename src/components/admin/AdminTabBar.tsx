import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAdminPendingCounts } from '~/hooks/useAdminData';

import { FONT } from './theme';
import { useAdminTheme } from './useAdminTheme';

/** Ordre d'affichage de la barre admin. `pointage` est le bouton central surélevé. */
const ORDER = ['index', 'presence', 'pointage', 'valider', 'plus'];

/** Routes accessibles hors barre (atteintes via le hub « Plus »). */
const HIDDEN = new Set(['equipe', 'planning', 'reports', 'sites', 'roles']);

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'grid-outline',
  presence: 'pulse-outline',
  valider: 'checkmark-circle-outline',
  plus: 'ellipsis-horizontal',
};

export function AdminTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const p = useAdminTheme();
  const counts = useAdminPendingCounts();
  const pendingTotal = counts.data?.total ?? 0;

  // Pointage = écran immersif plein écran (caméra) → pas de barre.
  if (state.routes[state.index]?.name === 'pointage') return null;

  const routes = state.routes
    .filter((r) => ORDER.includes(r.name) && !HIDDEN.has(r.name))
    .sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: p.line,
        backgroundColor: p.surface,
        paddingHorizontal: 8,
        paddingTop: 10,
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
        const label = typeof options.title === 'string' ? options.title : route.name;

        const onPress = () => {
          if (process.env.EXPO_OS === 'ios') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        // Bouton central « Pointer » surélevé.
        if (route.name === 'pointage') {
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={{ alignItems: 'center', marginTop: -34 }}
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

        const icon = ICONS[route.name] ?? 'ellipse-outline';
        const showBadge = route.name === 'valider' && pendingTotal > 0;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', gap: 5, paddingVertical: 4 }}
          >
            <View>
              <Ionicons name={icon} size={24} color={focused ? p.primary : p.muted2} />
              {showBadge ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 4,
                    borderRadius: 999,
                    backgroundColor: p.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontFamily: FONT.bold, fontSize: 9.5 }}>{pendingTotal}</Text>
                </View>
              ) : null}
            </View>
            <Text
              style={{
                fontSize: 10.5,
                fontFamily: focused ? FONT.bold : FONT.semibold,
                color: focused ? p.primary : p.muted,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
