import { useMutation, useQueryClient } from '@tanstack/react-query';

import { faceCheckIn } from '../api/attendance';
import type { FaceCheckInResponse } from '../api/types';
import { getOrCreateDeviceId } from '../lib/device-id';
import { compressForUpload } from '../lib/image';
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
      return faceCheckIn({
        photo,
        deviceId,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        wifiSSID,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
