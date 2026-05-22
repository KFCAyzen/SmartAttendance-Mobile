import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { RoleGate } from '~/components/RoleGate';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { useAdminOverview, useAdminPendingCounts } from '~/hooks/useAdminData';

export default function AdminScreen() {
  return (
    <RoleGate roles={['ADMIN', 'HR']} fallback={<Forbidden />}>
      <AdminOverview />
    </RoleGate>
  );
}

function AdminOverview() {
  const router = useRouter();
  const counts = useAdminPendingCounts();
  const overview = useAdminOverview();

  if (counts.isLoading || overview.isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3B82F6" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="gap-1 mt-2">
        <Text className="text-xs uppercase tracking-widest text-primary-700 dark:text-primary-100">
          SmartAttendance
        </Text>
        <Text className="text-3xl font-bold text-slate-900 dark:text-white">Admin</Text>
      </View>

      <View className="gap-3">
        <AdminTile
          label="Conges en attente"
          value={counts.data?.leaves ?? 0}
          icon="calendar"
          color="#3B82F6"
          onPress={() => router.push('/admin-leaves')}
        />
        <AdminTile
          label="Absences en attente"
          value={counts.data?.absences ?? 0}
          icon="alert-circle"
          color="#C2410C"
          onPress={() => router.push('/admin-absences')}
        />
      </View>

      <View className="rounded-3xl bg-white dark:bg-slate-900 p-5 gap-4 shadow-sm">
        <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Apercu 30 jours
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <Metric label="Employes actifs" value={overview.data?.activeEmployees ?? 0} />
          <Metric label="Pointages" value={overview.data?.totalCheckIns ?? 0} />
          <Metric label="Retards" value={overview.data?.lateArrivals ?? 0} />
          <Metric
            label="Presence"
            value={`${Math.round(overview.data?.attendanceRate ?? 0)}%`}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

function AdminTile({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-24 rounded-3xl bg-white dark:bg-slate-900 p-5 flex-row items-center justify-between shadow-sm active:opacity-70"
    >
      <View>
        <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
        <Text className="text-4xl font-bold text-slate-900 dark:text-white">{value}</Text>
      </View>
      <View className="h-12 w-12 rounded-2xl items-center justify-center bg-slate-100 dark:bg-slate-800">
        <Ionicons name={icon} size={26} color={color} />
      </View>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <View className="min-w-[45%] flex-1 rounded-2xl bg-slate-50 dark:bg-slate-800 p-4">
      <Text className="text-xs text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">{value}</Text>
    </View>
  );
}

function Forbidden() {
  return (
    <ScreenContainer scrollable={false}>
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Ionicons name="lock-closed" size={42} color="#64748B" />
        <Text className="text-center text-base text-slate-500 dark:text-slate-400">
          Cette section est reservee aux administrateurs.
        </Text>
      </View>
    </ScreenContainer>
  );
}
