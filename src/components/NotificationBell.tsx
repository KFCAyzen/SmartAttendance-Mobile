import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, useColorScheme, View } from 'react-native';

import { useUnreadCount } from '../hooks/useNotifications';

export function NotificationBell() {
  const router = useRouter();
  const scheme = useColorScheme();
  const { count } = useUnreadCount();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Notifications${count > 0 ? `, ${count} non lues` : ''}`}
      onPress={() => router.push('/notifications')}
      className="h-11 w-11 items-center justify-center rounded-[14px] border border-black/5 bg-surface-card dark:border-white/10 dark:bg-surface-cardDark"
    >
      <Ionicons
        name="notifications-outline"
        size={21}
        color={scheme === 'dark' ? '#F3F6FD' : '#0E1326'}
      />
      {count > 0 ? (
        <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-surface-card bg-accent dark:border-surface-cardDark" />
      ) : null}
    </Pressable>
  );
}
