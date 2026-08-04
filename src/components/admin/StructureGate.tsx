import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useStructures } from '~/hooks/useAdminData';
import { useSwitchStructure } from '~/hooks/useStructureSwitch';
import { useStructureStore } from '~/stores/structure.store';
import { AdminIcon } from './AdminIcon';
import { FONT, RADIUS, withAlpha } from './theme';
import { useAdminTheme } from './useAdminTheme';

/**
 * Passage obligé après connexion pour un admin multi-structures : tant qu'il
 * n'a pas choisi laquelle est active, on bloque l'accès au back-office avec un
 * plein écran de sélection (pas de fermeture par tap extérieur). Auto-résolu
 * silencieusement s'il n'en a qu'une seule — pas de friction dans ce cas.
 */
export function StructureGate({ children }: { children: ReactNode }) {
  const p = useAdminTheme();
  const { t } = useTranslation();
  const structures = useStructures();
  const activeStructureId = useStructureStore((s) => s.activeId);
  const { switchTo, switching } = useSwitchStructure();
  const list = structures.data ?? [];
  const autoSelected = useRef<string | null>(null);

  useEffect(() => {
    if (list.length === 1 && !activeStructureId && autoSelected.current !== list[0].id) {
      autoSelected.current = list[0].id;
      void switchTo(list[0]);
    }
  }, [list, activeStructureId]);

  if (structures.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: p.bg }}>
        <ActivityIndicator color={p.primary} />
      </View>
    );
  }

  // Une erreur réseau/serveur ne doit jamais se lire comme "aucune structure"
  // (silencieusement masquée derrière `.data ?? []`) : sans admin déjà choisie,
  // on bloque avec un message explicite plutôt que de laisser deviner.
  if (structures.isError && !activeStructureId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, backgroundColor: p.bg }}>
        <AdminIcon name="ban" size={32} color={p.danger} />
        <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: p.ink, textAlign: 'center' }}>
          {t('admin.bo.structureSwitcher.loadError')}
        </Text>
        <Pressable
          onPress={() => void structures.refetch()}
          style={{ paddingHorizontal: 18, paddingVertical: 11, borderRadius: RADIUS.base, backgroundColor: p.primary }}
        >
          <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: '#fff' }}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const needsChoice = list.length > 1 && !activeStructureId;
  if (!needsChoice) return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg, padding: 20, paddingTop: 70, gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', color: p.primary }}>
          {t('admin.bo.structureSwitcher.active')}
        </Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 26, color: p.ink }}>
          {t('admin.bo.structureSwitcher.chooseTitle')}
        </Text>
        <Text style={{ fontFamily: FONT.body, fontSize: 13.5, color: p.muted }}>
          {t('admin.bo.structureSwitcher.chooseSubtitle')}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {list.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => void switchTo(s)}
            disabled={switching}
            android_ripple={{ color: withAlpha(p.primary, 0.08) }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 13,
              padding: 16,
              borderRadius: RADIUS.lg,
              backgroundColor: p.surface,
              borderWidth: 1,
              borderColor: p.line,
              opacity: switching ? 0.6 : 1,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: withAlpha(p.primary, 0.12),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AdminIcon name={s.type === 'SCHOOL' ? 'school' : 'building'} size={22} color={p.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 15.5, color: p.ink }}>
                {s.name}
              </Text>
              {s.city ? (
                <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: p.muted }}>{s.city}</Text>
              ) : null}
            </View>
            <AdminIcon name="chevron" size={18} color={p.muted2} />
          </Pressable>
        ))}
      </View>

      {switching ? (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <ActivityIndicator color={p.primary} />
        </View>
      ) : null}
    </View>
  );
}
