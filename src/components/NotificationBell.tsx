import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, useColorScheme, View } from 'react-native';

import { useUnreadCount } from '../hooks/useNotifications';
import { NotificationsSheet } from './NotificationsSheet';

export function NotificationBell() {
  const scheme = useColorScheme();
  const { count } = useUnreadCount();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Notifications${count > 0 ? `, ${count} non lues` : ''}`}
        onPress={() => setOpen(true)}
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
      <NotificationsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
