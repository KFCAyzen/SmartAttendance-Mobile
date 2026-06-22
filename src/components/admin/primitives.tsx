import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminIcon, type AdminIconName } from './AdminIcon';
import {
  cardShadow,
  FONT,
  hueFor,
  RADIUS,
  statusMeta,
  toneColor,
  toneSoft,
  withAlpha,
  type PresenceStatus,
  type Tone,
} from './theme';
import { useAdminTheme } from './useAdminTheme';

// ── Conteneur scrollable d'écran (port de AdminBody) ─────────────────────────
export function AdminScrollBody({
  children,
  gap = 13,
}: {
  children: ReactNode;
  gap?: number;
}) {
  const p = useAdminTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingTop: 12, paddingBottom: 28, gap }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Carte ────────────────────────────────────────────────────────────────────
export function Card({
  children,
  pad = 18,
  soft = false,
  style,
  onPress,
}: {
  children: ReactNode;
  pad?: number;
  soft?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const p = useAdminTheme();
  const base: ViewStyle = {
    backgroundColor: soft ? p.surface2 : p.surface,
    borderRadius: RADIUS.lg,
    padding: pad,
    borderWidth: 1,
    borderColor: p.line,
    ...(soft ? null : cardShadow),
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: withAlpha(p.primary, 0.06) }}
        style={[base, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

// ── Pill ─────────────────────────────────────────────────────────────────────
export function Pill({
  children,
  tone = 'primary',
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const p = useAdminTheme();
  const fg = toneColor(p, tone);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: toneSoft(p, tone),
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: RADIUS.pill,
        alignSelf: 'flex-start',
      }}
    >
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: fg }} /> : null}
      <Text style={{ color: fg, fontFamily: FONT.bold, fontSize: 11.5 }}>{children}</Text>
    </View>
  );
}

// ── Titre de section ─────────────────────────────────────────────────────────
export function SectionTitle({
  children,
  action,
  onAction,
}: {
  children: ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  const p = useAdminTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
        paddingTop: 2,
      }}
    >
      <Text style={{ fontFamily: FONT.display, fontSize: 16.5, color: p.ink }}>{children}</Text>
      {action ? (
        <Pressable onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ color: p.primary, fontFamily: FONT.bold, fontSize: 13 }}>{action}</Text>
          <AdminIcon name="chevron" size={15} color={p.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ── En-tête d'écran (sur-titre cobalt + titre display) ───────────────────────
export function AdminHeader({
  title,
  sub,
  right,
  backLabel,
  onBack,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  backLabel?: string;
  onBack?: () => void;
}) {
  const p = useAdminTheme();
  const router = useRouter();
  return (
    <View style={{ gap: backLabel ? 10 : 0 }}>
      {backLabel ? (
        <Pressable
          onPress={() => (onBack ? onBack() : router.replace('/(admin)/plus' as never))}
          android_ripple={{ color: withAlpha(p.primary, 0.08), borderless: false }}
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderWidth: 1,
            borderColor: p.line,
            backgroundColor: p.surface,
            borderRadius: 999,
            paddingVertical: 8,
            paddingLeft: 10,
            paddingRight: 13,
          }}
        >
          <AdminIcon name="chevronLeft" size={16} color={p.primary} />
          <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: p.primary }}>{backLabel}</Text>
        </Pressable>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 2,
          paddingBottom: 4,
        }}
      >
        <View style={{ flex: 1, gap: 3 }}>
          {sub ? (
            <Text
              style={{
                fontFamily: FONT.bold,
                fontSize: 11,
                letterSpacing: 1.3,
                textTransform: 'uppercase',
                color: p.primary,
              }}
            >
              {sub}
            </Text>
          ) : null}
          <Text style={{ fontFamily: FONT.display, fontSize: 27, color: p.ink, letterSpacing: -0.5 }}>
            {title}
          </Text>
        </View>
        {right}
      </View>
    </View>
  );
}

// ── Bouton icône (44×44, avec badge optionnel) ───────────────────────────────
export function IconBtn({
  icon,
  onPress,
  badge,
  tone = 'ink',
}: {
  icon: AdminIconName;
  onPress?: () => void;
  badge?: number;
  tone?: 'ink' | 'primary';
}) {
  const p = useAdminTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: p.line,
          backgroundColor: p.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cardShadow,
      ]}
    >
      <AdminIcon name={icon} size={21} color={tone === 'ink' ? p.ink : p.primary} />
      {badge != null && badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            minWidth: 19,
            height: 19,
            paddingHorizontal: 5,
            borderRadius: 999,
            backgroundColor: p.accent,
            borderWidth: 2,
            borderColor: p.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontFamily: FONT.bold, fontSize: 10.5 }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ── Barre de recherche ───────────────────────────────────────────────────────
export function SearchBar({
  placeholder = 'Rechercher…',
  value,
  onChange,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const p = useAdminTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: RADIUS.base,
          backgroundColor: p.surface,
          borderWidth: 1,
          borderColor: p.line,
        },
        cardShadow,
      ]}
    >
      <AdminIcon name="search" size={18} color={p.muted2} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={p.muted2}
        style={{ flex: 1, fontFamily: FONT.body, fontSize: 14.5, color: p.ink, padding: 0 }}
      />
    </View>
  );
}

// ── Filtres horizontaux ──────────────────────────────────────────────────────
export interface ChipOption {
  key: string;
  label: string;
  count?: number;
  dot?: string;
}

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: ChipOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  const p = useAdminTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
    >
      {options.map((o) => {
        const on = value === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: on ? 'transparent' : p.line,
              backgroundColor: on ? p.ink : p.surface,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            {o.dot ? <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: o.dot }} /> : null}
            <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: on ? p.surface : p.muted }}>
              {o.label}
            </Text>
            {o.count != null ? (
              <Text style={{ fontFamily: FONT.bold, fontSize: 12.5, color: on ? p.surface : p.muted, opacity: 0.6 }}>
                {o.count}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Contrôle segmenté ────────────────────────────────────────────────────────
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string; count?: number }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const p = useAdminTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        backgroundColor: p.surface2,
        borderRadius: RADIUS.base,
        borderWidth: 1,
        borderColor: p.line,
      }}
    >
      {options.map((o) => {
        const on = value === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: on ? p.surface : 'transparent',
                borderRadius: RADIUS.base - 6,
                paddingVertical: 9,
                paddingHorizontal: 6,
              },
              on ? cardShadow : null,
            ]}
          >
            <Text style={{ fontFamily: FONT.bold, fontSize: 13, color: on ? p.ink : p.muted }}>
              {o.label}
            </Text>
            {o.count != null ? (
              <View
                style={{
                  backgroundColor: on ? withAlpha(p.primary, 0.12) : p.line,
                  borderRadius: 999,
                  paddingHorizontal: 7,
                  paddingVertical: 1,
                }}
              >
                <Text style={{ fontFamily: FONT.bold, fontSize: 11, color: on ? p.primary : p.muted }}>
                  {o.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Avatar employé (dégradé déterministe + pastille de statut) ───────────────
export function EmpAvatar({
  name,
  initials,
  size = 44,
  status,
  radius,
}: {
  name: string;
  initials: string;
  size?: number;
  status?: PresenceStatus;
  radius?: number;
}) {
  const p = useAdminTheme();
  const h = hueFor(name || initials);
  const r = radius != null ? radius : size * 0.34;
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[`hsl(${h}, 58%, 55%)`, `hsl(${(h + 38) % 360}, 55%, 45%)`]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ width: size, height: size, borderRadius: r, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: FONT.display, color: '#fff', fontSize: size * 0.37 }}>{initials}</Text>
      </LinearGradient>
      {status ? (
        <View
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: 999,
            backgroundColor: statusMeta(p, status).color,
            borderWidth: 2.5,
            borderColor: p.surface,
          }}
        />
      ) : null}
    </View>
  );
}

// ── Tuile KPI (variante sobre/confortable) ───────────────────────────────────
export function KPITile({
  icon,
  label,
  value,
  sub,
  tone = 'primary',
  trend,
}: {
  icon: AdminIconName;
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
  trend?: { up: boolean; v: string };
}) {
  const p = useAdminTheme();
  const c = toneColor(p, tone);
  return (
    <View
      style={[
        {
          flex: 1,
          minWidth: 0,
          borderRadius: RADIUS.base,
          padding: 15,
          paddingHorizontal: 16,
          backgroundColor: p.surface,
          borderWidth: 1,
          borderColor: p.line,
          gap: 10,
        },
        cardShadow,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            backgroundColor: withAlpha(c, 0.13),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AdminIcon name={icon} size={18} color={c} />
        </View>
        {trend ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <AdminIcon name={trend.up ? 'trend' : 'trend'} size={13} color={trend.up ? p.success : p.danger} />
            <Text style={{ fontFamily: FONT.bold, fontSize: 11, color: trend.up ? p.success : p.danger }}>
              {trend.v}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ gap: 2 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 26, color: p.ink, letterSpacing: -0.5 }}>
          {value}
        </Text>
        <Text style={{ fontFamily: FONT.semibold, fontSize: 12, color: p.muted }}>{label}</Text>
      </View>
      {sub ? <Text style={{ fontFamily: FONT.body, fontSize: 11.5, color: p.muted2 }}>{sub}</Text> : null}
    </View>
  );
}

// ── Carte métrique (label + grand nombre + pied) ─────────────────────────────
export function MetricCard({
  label,
  value,
  unit,
  foot,
}: {
  label: string;
  value: string;
  unit?: string;
  foot?: ReactNode;
}) {
  const p = useAdminTheme();
  return (
    <Card pad={16} style={{ flex: 1 }}>
      <Text
        style={{
          fontFamily: FONT.bold,
          fontSize: 11.5,
          color: p.muted,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 27, color: p.ink, marginTop: 5, letterSpacing: -0.5 }}>
        {value}
        {unit ? <Text style={{ fontSize: 14, color: p.muted }}> {unit}</Text> : null}
      </Text>
      {foot ? <View style={{ marginTop: 6, flexDirection: 'row' }}>{foot}</View> : null}
    </Card>
  );
}

// ── Barre de progression ─────────────────────────────────────────────────────
export function ProgressBar({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color?: string;
}) {
  const p = useAdminTheme();
  const pct = Math.min(100, Math.round((value / (total || 1)) * 100));
  return (
    <View style={{ height: 7, borderRadius: 999, backgroundColor: p.line, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: color ?? p.primary }} />
    </View>
  );
}

// ── Ligne employé / data (port de DataRow) ───────────────────────────────────
export interface RowEmp {
  first: string;
  last: string;
  initials: string;
  role: string;
  dept: string;
  status?: PresenceStatus;
}

export function DataRow({
  emp,
  right,
  onPress,
}: {
  emp: RowEmp;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const p = useAdminTheme();
  const meta = emp.status ? statusMeta(p, emp.status) : null;
  const body = (
    <>
      <EmpAvatar name={`${emp.first} ${emp.last}`} initials={emp.initials} size={44} status={emp.status} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: 15, color: p.ink }}>
          {emp.first} {emp.last}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: FONT.body, fontSize: 12, color: p.muted }}>
          {emp.role} · {emp.dept}
        </Text>
      </View>
      {right !== undefined ? (
        right
      ) : meta ? (
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: meta.color }} />
            <Text style={{ fontFamily: FONT.bold, fontSize: 12, color: meta.color }}>{meta.label}</Text>
          </View>
        </View>
      ) : null}
    </>
  );
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: p.surface,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: p.line,
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: withAlpha(p.primary, 0.06) }}
        style={[style, cardShadow]}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={[style, cardShadow]}>{body}</View>;
}
