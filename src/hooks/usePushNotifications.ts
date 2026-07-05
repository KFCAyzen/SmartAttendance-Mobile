import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { updateDevicePushToken } from '../api/devices';
import { getOrCreateDeviceId } from '../lib/device-id';
import { registerForPushNotifications } from '../lib/push';
import { useAuthStore } from '../stores/auth.store';

/**
 * Cible de navigation d'une notification push, selon son type et la vue
 * effective (un admin basculé en mode employé est routé comme un employé).
 */
export function pushTargetRoute(
  data: { type?: string; actionUrl?: string | null } | undefined,
  effectiveAdmin: boolean,
): string {
  const type = data?.type ?? '';
  if (type.startsWith('LEAVE_')) {
    return effectiveAdmin ? '/(admin)/demandes' : '/(tabs)/demandes';
  }
  if (type === 'ATTENDANCE_REMINDER') {
    return effectiveAdmin ? '/(admin)/(home)/pointage' : '/(tabs)/pointage';
  }
  return '/notifications';
}

/**
 * Orchestration des push : une fois la session authentifiée, obtient le jeton
 * Expo Push (demande la permission au besoin) et l'attache à l'appareil côté
 * backend ; route les taps sur notification vers l'écran concerné.
 */
export function usePushNotifications(): void {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const canAdmin = useAuthStore((s) => s.user?.role === 'ADMIN' || s.user?.role === 'HR');
  const viewMode = useAuthStore((s) => s.viewMode);
  const effectiveAdmin = canAdmin && viewMode === 'admin';
  // Une seule tentative d'enregistrement par session authentifiée.
  const registeredRef = useRef(false);
  // La notification de démarrage à froid ne doit être traitée qu'une fois.
  const coldStartHandledRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      registeredRef.current = false;
      return;
    }
    if (registeredRef.current) return;
    registeredRef.current = true;

    void (async () => {
      const token = await registerForPushNotifications();
      if (!token) return;
      try {
        const deviceId = await getOrCreateDeviceId();
        await updateDevicePushToken({ deviceId, expoPushToken: token });
      } catch {
        // Best-effort : retenté à la prochaine session.
        registeredRef.current = false;
      }
    })();
  }, [status]);

  useEffect(() => {
    const navigate = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | { type?: string; actionUrl?: string | null }
        | undefined;
      router.push(pushTargetRoute(data, effectiveAdmin) as never);
    };

    // Tap sur une notification pendant que l'app tourne.
    const sub = Notifications.addNotificationResponseReceivedListener(navigate);

    // Notification qui a lancé l'app (démarrage à froid) — une seule fois.
    if (!coldStartHandledRef.current && status === 'authenticated') {
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response && !coldStartHandledRef.current) {
          coldStartHandledRef.current = true;
          navigate(response);
        }
      });
    }

    return () => sub.remove();
  }, [effectiveAdmin, status, router]);
}
