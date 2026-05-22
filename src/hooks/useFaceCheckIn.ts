import { useMutation, useQueryClient } from '@tanstack/react-query';

import { faceCheckIn } from '../api/attendance';
import { isNetworkError } from '../api/client';
import type { FaceCheckInResponse } from '../api/types';
import { getOrCreateDeviceId } from '../lib/device-id';
import { compressForUpload } from '../lib/image';
import { useOfflineQueueStore } from '../stores/offline-queue.store';
import type { Coordinates } from './useLocation';

interface CheckInArgs {
  photoUri: string;
  coords?: Coordinates | null;
  wifiSSID?: string;
}

export function useFaceCheckIn() {
  const queryClient = useQueryClient();

  return useMutation<FaceCheckInResponse, unknown, CheckInArgs>({
    mutationFn: async ({ photoUri, coords, wifiSSID }) => {
      const [deviceId, photo] = await Promise.all([
        getOrCreateDeviceId(),
        compressForUpload(photoUri),
      ]);
      try {
        return await faceCheckIn({
          photo,
          deviceId,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          wifiSSID,
        });
      } catch (error) {
        if (!isNetworkError(error)) throw error;

        useOfflineQueueStore.getState().add({
          id: `${deviceId}-${Date.now()}`,
          deviceId,
          photoBase64: photo,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          wifiSSID,
          timestamp: Date.now(),
          attempts: 0,
        });

        return {
          success: true,
          message: 'Pointage mis en file, il sera envoyé dès le retour de la connexion.',
        };
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
