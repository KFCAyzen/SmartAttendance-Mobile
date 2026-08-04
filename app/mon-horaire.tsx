import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { getMySchedule, type Schedule } from '~/api/schedules';
import { Card } from '~/components/ui/Card';
import { ScreenContainer } from '~/components/ui/ScreenContainer';

function getWorkDays(workDays: Schedule['workDays']): number[] {
  if (Array.isArray(workDays)) {
    return workDays.filter((day): day is number => typeof day === 'number');
  }
  if (typeof workDays === 'string') {
    try {
      const parsed = JSON.parse(workDays);
      return Array.isArray(parsed) ? parsed.filter((day): day is number => typeof day === 'number') : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function MonHoraireScreen() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: ['schedules', 'self'], queryFn: getMySchedule });
  const schedule = query.data?.[0];
  const days = [
    t('schedule.days.mon'),
    t('schedule.days.tue'),
    t('schedule.days.wed'),
    t('schedule.days.thu'),
    t('schedule.days.fri'),
    t('schedule.days.sat'),
    t('schedule.days.sun'),
  ];
  const workDays = schedule ? getWorkDays(schedule.workDays) : [];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('schedule.title') }} />
      <ScreenContainer>
        <Text className="font-body text-[13px] leading-5 text-muted dark:text-slate-400">
          {t('schedule.subtitle')}
        </Text>

        {query.isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#2F5BFF" />
          </View>
        ) : schedule ? (
          <Card className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-[19px] text-ink dark:text-white">{schedule.name}</Text>
              <View className="rounded-full bg-blue-50 px-2.5 py-1 dark:bg-blue-500/15">
                <Text className="font-bodyBold text-[11px] text-blue-700 dark:text-blue-300">
                  {schedule.type}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2.5">
              <InfoTile label={t('schedule.info.hoursPerDay')} value={`${schedule.hoursPerDay}h`} />
              <InfoTile label={t('schedule.info.start')} value={schedule.startTime} />
              <InfoTile label={t('schedule.info.end')} value={schedule.endTime} />
            </View>

            <View className="gap-2">
              <Text className="font-bodyBold text-[12px] uppercase tracking-wide text-muted dark:text-slate-400">
                {t('schedule.info.workDays')}
              </Text>
              <View className="flex-row gap-1.5">
                {days.map((day, i) => {
                  const isWorkDay = workDays.includes(i + 1);
                  return (
                    <View
                      key={i}
                      className={`flex-1 items-center rounded-[10px] py-2 ${
                        isWorkDay ? 'bg-primary' : 'bg-surface-soft dark:bg-surface-softDark'
                      }`}
                    >
                      <Text
                        className={`font-bodySemibold text-[11.5px] ${
                          isWorkDay ? 'text-white' : 'text-muted dark:text-slate-400'
                        }`}
                      >
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </Card>
        ) : (
          <Card className="flex-row items-center gap-3.5" soft>
            <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-yellow-100 dark:bg-yellow-900/30">
              <Ionicons name="calendar-outline" size={20} color="#CA8A04" />
            </View>
            <View className="flex-1">
              <Text className="font-bodySemibold text-[14.5px] text-ink dark:text-white">
                {t('schedule.noSchedule.title')}
              </Text>
              <Text className="font-body text-[12.5px] text-muted dark:text-slate-400">
                {t('schedule.noSchedule.description')}
              </Text>
            </View>
          </Card>
        )}
      </ScreenContainer>
    </>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[100px] flex-1 gap-1 rounded-[14px] bg-surface-soft p-3 dark:bg-surface-softDark">
      <Text className="font-body text-[11px] text-muted dark:text-slate-400">{label}</Text>
      <Text className="font-bodySemibold text-[14px] text-ink dark:text-white">{value}</Text>
    </View>
  );
}
