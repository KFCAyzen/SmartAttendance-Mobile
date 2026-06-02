import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Returns the current device coordinates if permission is granted.
 * Non-fatal: callers should treat null as "location unavailable" and proceed.
 */
export function useLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCoords = useCallback(async (): Promise<Coordinates | null> => {
    setLoading(true);
    try {
      const existing = await Location.getForegroundPermissionsAsync();
      let granted = existing.granted;
      if (!granted) {
        const request = await Location.requestForegroundPermissionsAsync();
        granted = request.granted;
      }
      if (!granted) {
        setCoords(null);
        return null;
      }
      // getCurrentPositionAsync can hang on emulators with no GPS fix — cap it
      // at 4s and fall back to the last known position. Coords are optional for
      // check-in, so a miss must never block the capture.
      const fresh = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]);
      const position = fresh ?? (await Location.getLastKnownPositionAsync());
      if (!position) {
        setCoords(null);
        return null;
      }
      const result = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(result);
      return result;
    } catch {
      setCoords(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, loading, fetchCoords };
}
