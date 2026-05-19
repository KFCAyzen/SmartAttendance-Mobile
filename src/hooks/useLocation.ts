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
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
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
