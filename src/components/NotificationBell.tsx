import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useUnreadCount } from '../hooks/useNotifications';

export function NotificationBell() {
  const router = useRouter();
  const { count } = useUnreadCount();
  const display = count > 9 ? '9+' : String(count);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Notifications${count > 0 ? `, ${count} non lues` : ''}`}
      onPress={() => router.push('/notifications')}
      className="h-11 w-11 rounded-full bg-white dark:bg-slate-900 items-center justify-center shadow-sm"
    >
      <Ionicons name="notifications" size={20} color="#1E40AF" />
      {count > 0 ? (
        <View className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-danger px-1 items-center justify-center">
          <Text className="text-[10px] font-bold text-white">{display}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
