import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { faceCheckIn } from '../api/attendance';
import { feedback } from '../components/feedback';
import { humanizeApiError, isNetworkError } from '../api/client';
import { useOfflineQueueStore } from '../stores/offline-queue.store';
import { useAuthStore } from '../stores/auth.store';

export function useOfflineSync() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const queue = useOfflineQueueStore((s) => s.queue);
  const pop = useOfflineQueueStore((s) => s.pop);
  const markAttempt = useOfflineQueueStore((s) => s.markAttempt);
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const syncingRef = useRef(false);

  const syncNext = useCallback(async () => {
    const item = useOfflineQueueStore.getState().queue[0];
    if (!item || !isAuthenticated || syncingRef.current) return;

    syncingRef.current = true;
    markAttempt(item.id);
    try {
      await faceCheckIn({
        photo: item.photoBase64,
        deviceId: item.deviceId,
        latitude: item.latitude,
        longitude: item.longitude,
        wifiSSID: item.wifiSSID,
      });
      pop();
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      feedback.success(t('checkin.synced'));
    } catch (error) {
      if (!isNetworkError(error)) {
        pop();
        feedback.error(t('checkin.offlineRejected'), humanizeApiError(error));
      }
    } finally {
      syncingRef.current = false;
    }
  }, [isAuthenticated, markAttempt, pop, queryClient, t]);

  useEffect(() => {
    if (!queue.length || !isAuthenticated) return;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const reachable = state.isConnected && state.isInternetReachable !== false;
      if (reachable) void syncNext();
    });

    void NetInfo.fetch().then((state) => {
      const reachable = state.isConnected && state.isInternetReachable !== false;
      if (reachable) void syncNext();
    });

    return unsubscribe;
  }, [isAuthenticated, queue.length, syncNext]);
}
