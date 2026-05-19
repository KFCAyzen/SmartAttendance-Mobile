import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { getMyPhoto, requestPhotoChange, setMyPhoto } from '../api/users';
import { compressForUpload } from '../lib/image';

const photoKey = ['users', 'me', 'photo'] as const;

export function useReferencePhoto() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: photoKey,
    queryFn: getMyPhoto,
    staleTime: 1000 * 60 * 5,
  });

  const upload = useMutation({
    mutationFn: async ({ uri, mode }: { uri: string; mode: 'set' | 'request' }) => {
      const photoBase64 = await compressForUpload(uri, { maxWidth: 720, quality: 0.75 });
      if (mode === 'request') return requestPhotoChange(photoBase64);
      return setMyPhoto(photoBase64);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: photoKey });
    },
  });

  async function pickAndUpload(mode: 'set' | 'request') {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
      cameraType: ImagePicker.CameraType.front,
    });
    if (result.canceled || !result.assets[0]?.uri) return null;
    return upload.mutateAsync({ uri: result.assets[0].uri, mode });
  }

  async function pickFromLibraryAndUpload(mode: 'set' | 'request') {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.uri) return null;
    return upload.mutateAsync({ uri: result.assets[0].uri, mode });
  }

  return {
    photo: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    upload,
    pickAndUpload,
    pickFromLibraryAndUpload,
  };
}
