import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

export interface WifiInfo {
  ssid?: string;
  bssid?: string;
}

export type WifiScanResult =
  | { ok: true; wifi: WifiInfo }
  | { ok: false; reason: 'permission' | 'location-off' | 'not-wifi' | 'unavailable' };

// Android renvoie ces valeurs sentinelles quand la permission localisation
// manque : à traiter comme "non disponible", jamais à stocker/envoyer.
const INVALID_SSID = '<unknown ssid>';
const INVALID_BSSID = '02:00:00:00:00:00';

/** SSID sans guillemets entourants, vide/sentinelle → undefined. */
function normalizeSsid(raw?: string | null): string | undefined {
  const ssid = raw?.replace(/^"|"$/g, '').trim();
  if (!ssid || ssid === INVALID_SSID) return undefined;
  return ssid;
}

/** BSSID en minuscules avec séparateur `:`, vide/sentinelle → undefined. */
function normalizeBssid(raw?: string | null): string | undefined {
  const bssid = raw?.toLowerCase().replace(/-/g, ':').trim();
  if (!bssid || bssid === INVALID_BSSID) return undefined;
  return bssid;
}

/**
 * Lit le SSID/BSSID du Wi-Fi courant, normalisés au format attendu par le
 * backend. Non-fatal : les appelants peuvent ignorer un échec et continuer.
 */
export async function scanWifi(): Promise<WifiScanResult> {
  // Android n'expose le SSID/BSSID que si la permission de localisation est
  // accordée ET que les services de localisation (GPS) sont activés.
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return { ok: false, reason: 'permission' };
  if (!(await Location.hasServicesEnabledAsync())) return { ok: false, reason: 'location-off' };

  // Par défaut NetInfo ne lit pas le SSID/BSSID (coûteux + permission) : il faut
  // l'activer explicitement, puis forcer une lecture native fraîche via refresh().
  NetInfo.configure({ shouldFetchWiFiSSID: true });
  const state = await NetInfo.refresh();
  if (state.type !== 'wifi') return { ok: false, reason: 'not-wifi' };

  const d = state.details as { ssid?: string | null; bssid?: string | null } | null;
  const ssid = normalizeSsid(d?.ssid);
  if (!ssid) return { ok: false, reason: 'unavailable' };

  return { ok: true, wifi: { ssid, bssid: normalizeBssid(d?.bssid) } };
}
