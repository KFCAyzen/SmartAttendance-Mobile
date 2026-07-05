import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notifications push (Expo Push). Tout est best-effort : sans permission,
 * sans FCM configuré ou sans réseau, l'app fonctionne normalement — le jeton
 * vaut simplement `null` et le backend n'enverra que la notification in-app.
 */

/** Comportement des notifications reçues app au premier plan. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Demande la permission puis retourne le jeton Expo Push, ou `null` si
 * indisponible (simulateur, permission refusée, FCM absent…).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Les push ne fonctionnent que sur appareil physique.
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
      // Sur Android 13+, le prompt de permission n'apparaît qu'après la
      // création d'au moins un canal.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2F5BFF',
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    // FCM non configuré / réseau / autre : jamais bloquant.
    return null;
  }
}
