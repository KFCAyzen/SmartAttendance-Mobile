import Constants from 'expo-constants';

const FALLBACK = 'http://10.0.2.2:3001';

/**
 * Base URL de l'API.
 *
 * En dev (Expo Go / dev-client), le backend tourne sur la même machine que le
 * serveur Metro. On dérive donc l'IP depuis l'hôte Metro auquel le téléphone
 * s'est connecté : ça marche quel que soit le réseau (LAN, partage de connexion
 * iPhone, émulateur) sans devoir éditer le .env à chaque changement de réseau.
 *
 * On retombe sur EXPO_PUBLIC_API_URL si l'hôte Metro n'est pas une IPv4
 * joignable (mode --tunnel : hôte *.exp.direct) ou en build de production.
 */
function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

  if (__DEV__) {
    // ex. "172.20.10.2:8081" ou "10.42.0.127:8081"
    const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
    const isIPv4 = metroHost ? /^\d{1,3}(\.\d{1,3}){3}$/.test(metroHost) : false;
    if (metroHost && isIPv4) {
      // On garde le port de l'API du .env (par défaut 3001).
      const port = envUrl?.match(/:(\d+)(?:\/|$)/)?.[1] ?? '3001';
      return `http://${metroHost}:${port}`;
    }
  }

  return envUrl ?? FALLBACK;
}

export const API_BASE_URL = resolveBaseUrl();
