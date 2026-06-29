import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Card } from '~/components/ui/Card';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { StatusPill } from '~/components/ui/StatusPill';
import { useAuth } from '~/hooks/useAuth';

interface SpaceAction {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  tone: 'primary' | 'success' | 'accent' | 'warning';
}

const ACTIONS: SpaceAction[] = [
  { key: 'profile', icon: 'person-outline', route: '/(admin)/profile', tone: 'primary' },
  { key: 'leaves', icon: 'calendar-outline', route: '/(admin)/demandes', tone: 'accent' },
  { key: 'history', icon: 'time-outline', route: '/(admin)/historique', tone: 'success' },
];

const TONE_CLASS: Record<SpaceAction['tone'], { bg: string; color: string }> = {
  primary: { bg: 'bg-primary/10', color: '#2F5BFF' },
  success: { bg: 'bg-success/15', color: '#16A34A' },
  accent: { bg: 'bg-accent/15', color: '#FF8A3D' },
  warning: { bg: 'bg-warning/15', color: '#F59E0B' },
};

export default function AdminSpaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const name = user ? `${user.firstName} ${user.lastName}` : t('admin.bo.espace.defaultName');
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((part) => (part as string).charAt(0).toUpperCase())
    .join('');

  return (
    <ScreenContainer contentClassName="flex-grow px-5 pt-4 pb-7 gap-3.5">
      <View className="flex-row items-center gap-3 pt-1">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-surface-card shadow-sm dark:bg-surface-cardDark"
        >
          <Ionicons name="chevron-back" size={22} color="#2F5BFF" />
        </Pressable>
        <View className="flex-1 gap-[3px]">
          <Text className="font-bodyBold text-[11px] uppercase tracking-[1.4px] text-primary">
            SmartAttendance
          </Text>
          <Text className="font-display text-[30px] leading-none text-ink dark:text-white">
            {t('admin.bo.espace.title')}
          </Text>
        </View>
      </View>

      <Card className="gap-4">
        <View className="flex-row items-center gap-[15px]">
          <LinearGradient
            colors={['#2F5BFF', '#8D70A8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: 64,
              width: 64,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 22,
            }}
          >
            <Text className="font-display text-[23px] text-white">{initials || '-'}</Text>
          </LinearGradient>
          <View className="flex-1">
            <Text className="font-display text-[20px] text-ink dark:text-white">{name}</Text>
            <Text className="font-body text-[13px] text-muted dark:text-slate-400">
              {user?.email ?? '-'}
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {user?.role ? <StatusPill tone="primary">{user.role}</StatusPill> : null}
              {user?.department ? <StatusPill tone="neutral">{user.department}</StatusPill> : null}
            </View>
          </View>
        </View>
      </Card>

      <Card pad={0} className="overflow-hidden">
        {ACTIONS.map((action, index) => (
          <SpaceRow
            key={action.key}
            action={action}
            label={t(`admin.bo.espace.${action.key}Label`)}
            detail={t(`admin.bo.espace.${action.key}Detail`)}
            last={index === ACTIONS.length - 1}
            onPress={() => router.push(action.route as never)}
          />
        ))}
      </Card>
    </ScreenContainer>
  );
}

function SpaceRow({
  action,
  label,
  detail,
  last,
  onPress,
}: {
  action: SpaceAction;
  label: string;
  detail: string;
  last: boolean;
  onPress: () => void;
}) {
  const tone = TONE_CLASS[action.tone];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-[15px] active:bg-black/5 dark:active:bg-white/5 ${
        last ? '' : 'border-b border-black/5 dark:border-white/10'
      }`}
    >
      <View className={`h-10 w-10 items-center justify-center rounded-[13px] ${tone.bg}`}>
        <Ionicons name={action.icon} size={20} color={tone.color} />
      </View>
      <View className="flex-1">
        <Text className="font-bodyBold text-[15px] text-ink dark:text-white">{label}</Text>
        <Text className="mt-0.5 font-body text-[12.5px] text-muted dark:text-slate-400">
          {detail}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#9AA5BE" />
    </Pressable>
  );
}
