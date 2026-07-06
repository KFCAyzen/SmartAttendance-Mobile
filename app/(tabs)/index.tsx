import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { getHistory, getWeeklyStats } from '~/api/attendance';
import { NotificationBell } from '~/components/NotificationBell';
import { Card } from '~/components/ui/Card';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { StatChip } from '~/components/ui/StatChip';
import { StatusPill } from '~/components/ui/StatusPill';
import { WeekBars } from '~/components/ui/WeekBars';
import { useAuth } from '~/hooks/useAuth';
import { formatDuration, formatHoursShort, formatTime } from '~/lib/date';

// Libellés jour (lundi → dimanche) selon la langue.
const DAY_LABELS: Record<'fr' | 'en', string[]> = {
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};
// Index (lundi = 0) du jour courant, pour la barre mise en avant.
const todayWeekIndex = (new Date().getDay() + 6) % 7;

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const firstName = user?.firstName ?? '';
  const locale = i18n.language?.startsWith('en') ? enUS : fr;
  const dateLabel = useMemo(() => {
    const d = format(new Date(), 'EEEE d MMMM', { locale });
    return d.charAt(0).toUpperCase() + d.slice(1);
  }, [locale]);

  // Dernier pointage du jour → statut « En service » + heure d'arrivée.
  const history = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => getHistory(1, 20),
  });

  const today = useMemo(() => {
    const items = history.data?.data ?? history.data?.attendances ?? [];
    return items
      .filter((i) => isToday(new Date(i.timestamp)))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
  }, [history.data]);

  const firstCheckIn = today.find((i) => i.type === 'CHECK_IN');
  const last = today[today.length - 1];
  const checkedIn = last?.type === 'CHECK_IN';
  const arrivalTs = firstCheckIn ? new Date(firstCheckIn.timestamp).getTime() : null;
  const arrivalLabel = firstCheckIn ? formatTime(firstCheckIn.timestamp) : '—';

  // Chrono live (1 s) tant qu'on est en service.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!checkedIn || !arrivalTs) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [checkedIn, arrivalTs]);
  const elapsed = checkedIn && arrivalTs ? now - arrivalTs : 0;

  // Temps travaillé aujourd'hui : chrono live tant qu'on est en service, sinon
  // les heures du check-out — les puces du jour restent remplies après la sortie.
  const lastCheckOut = [...today].reverse().find((i) => i.type === 'CHECK_OUT');
  const todayWorkedMs =
    checkedIn && arrivalTs
      ? elapsed
      : lastCheckOut?.hoursWorked != null
        ? lastCheckOut.hoursWorked * 3_600_000
        : lastCheckOut && arrivalTs
          ? new Date(lastCheckOut.timestamp).getTime() - arrivalTs
          : 0;

  // Stats de la semaine (graphe, total, ponctualité).
  const weekly = useQuery({ queryKey: ['attendance', 'weekly'], queryFn: getWeeklyStats });
  const localeKey = i18n.language?.startsWith('en') ? 'en' : 'fr';
  const weekBars = useMemo(() => {
    const days = weekly.data?.days;
    if (!days?.length) return DAY_LABELS[localeKey].map((label) => ({ label, v: 0 }));
    return days.map((d) => ({ label: DAY_LABELS[localeKey][d.weekday - 1] ?? '', v: d.hours }));
  }, [weekly.data, localeKey]);
  const weekTotal = weekly.data ? formatHoursShort(weekly.data.totalHours) : '—';
  const onTimePct = weekly.data?.onTimePct ?? null;

  const goPointage = () => router.push('/(tabs)/pointage');

  return (
    <ScreenContainer contentClassName="flex-grow px-5 pt-4 pb-7 gap-3.5">
      {/* Header */}
      <View className="flex-row items-end justify-between gap-3 pt-1">
        <View className="flex-1 gap-[3px]">
          <Text className="font-bodyBold text-[11px] uppercase tracking-[1.4px] text-primary">
            {t('common.appName')}
          </Text>
          <Text className="font-display text-[30px] leading-none text-ink dark:text-white">
            {firstName
              ? t('home.greetingWithName', { name: firstName })
              : t('home.greeting')}
          </Text>
          <Text className="mt-1 font-bodyMedium text-[14.5px] text-muted dark:text-slate-400">
            {dateLabel}
          </Text>
        </View>
        <NotificationBell />
      </View>

      {/* Hero — statut du jour */}
      {checkedIn ? (
        <Card className="flex-1 justify-between gap-4">
          <View className="flex-row items-center justify-between">
            <StatusPill tone="success" dot>
              {t('home.onDuty')}
            </StatusPill>
            <Text className="font-bodySemibold text-[12.5px] text-muted dark:text-slate-400">
              {t('home.arrivalAt', { time: arrivalLabel })}
            </Text>
          </View>
          <View className="gap-0.5">
            <Text className="font-bodyBold text-[12.5px] tracking-wide text-muted dark:text-slate-400">
              {t('home.workTime')}
            </Text>
            <Text className="font-display text-[44px] leading-none text-ink dark:text-white">
              {formatDuration(elapsed)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={goPointage}
            className="flex-row items-center justify-center gap-2 rounded-[20px] border border-black/5 bg-surface-soft py-[15px] active:opacity-90 dark:border-white/10 dark:bg-surface-softDark"
          >
            <Ionicons name="arrow-up-outline" size={20} color="#FF8A3D" />
            <Text className="font-bodyBold text-[15px] text-ink dark:text-white">
              {t('home.checkOut')}
            </Text>
          </Pressable>
        </Card>
      ) : (
        <View className="flex-1 overflow-hidden rounded-[28px] border border-black/5 dark:border-white/10">
          <LinearGradient
            colors={['#2F5BFF', '#826EB1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={{ flex: 1, padding: 20 }}
          >
            <View className="flex-1 justify-between gap-4">
              <View className="gap-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-bodyBold text-[12.5px] tracking-wide text-white/85">
                      {t('home.statusTitle')}
                    </Text>
                    <Text className="mt-1 font-display text-[23px] text-white">
                      {t('home.notCheckedIn')}
                    </Text>
                  </View>
                  <View className="h-[46px] w-[46px] items-center justify-center rounded-[16px] bg-white/[0.18]">
                    <Ionicons name="happy-outline" size={26} color="#fff" />
                  </View>
                </View>
                <Text className="font-body text-[13.5px] leading-5 text-white/90">
                  {t('home.notCheckedInHint')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={goPointage}
                className="flex-row items-center justify-center gap-2 rounded-[20px] bg-white py-[15px] active:opacity-90"
              >
                <Ionicons name="scan" size={20} color="#2F5BFF" />
                <Text className="font-bodyBold text-[15px] text-primary">
                  {t('home.checkInArrival')}
                </Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Stat chips */}
      <View className="flex-row gap-2.5">
        <StatChip
          icon="arrow-down-outline"
          label={t('home.chipArrival')}
          value={arrivalLabel}
          tone="success"
        />
        <StatChip
          icon="time-outline"
          label={t('home.chipToday')}
          value={todayWorkedMs > 0 ? formatDuration(todayWorkedMs).slice(0, 5) : '—'}
          tone="primary"
        />
        <StatChip
          icon="trending-up-outline"
          label={t('home.chipWeek')}
          value={weekTotal}
          tone="accent"
        />
      </View>

      {/* Cette semaine */}
      <Card className="flex-[3] gap-3.5">
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-[16px] text-ink dark:text-white">
            {t('home.thisWeek')}
          </Text>
          {onTimePct != null ? (
            <StatusPill tone="primary">{t('home.onTime', { pct: onTimePct })}</StatusPill>
          ) : null}
        </View>
        <WeekBars data={weekBars} accentIndex={todayWeekIndex} fill />
      </Card>

      {/* Actions douces */}
      <View className="flex-row gap-2.5">
        <SoftAction
          icon="calendar-outline"
          label={t('home.requestLeave')}
          tone="primary"
          onPress={() => router.push('/leave-new')}
        />
        <SoftAction
          icon="document-text-outline"
          label={t('home.justifyAbsence')}
          tone="accent"
          onPress={() => router.push('/(tabs)/demandes')}
        />
      </View>
    </ScreenContainer>
  );
}

function SoftAction({
  icon,
  label,
  tone,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: 'primary' | 'accent';
  onPress: () => void;
}) {
  const isPrimary = tone === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`flex-1 gap-2.5 rounded-[20px] p-[14px] active:opacity-80 ${
        isPrimary ? 'bg-primary/10' : 'bg-accent/15'
      }`}
    >
      <Ionicons name={icon} size={22} color={isPrimary ? '#2F5BFF' : '#FF8A3D'} />
      <Text
        className={`font-bodyBold text-[13.5px] ${
          isPrimary ? 'text-primary' : 'text-accent'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
