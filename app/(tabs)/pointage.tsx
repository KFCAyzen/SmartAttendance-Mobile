import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { humanizeApiError } from '~/api/client';
import type { FaceCheckInResponse } from '~/api/types';
import { Button } from '~/components/ui/Button';
import { useFaceCheckIn } from '~/hooks/useFaceCheckIn';
import { useLocation } from '~/hooks/useLocation';

export default function PointageScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastResult, setLastResult] = useState<FaceCheckInResponse | null>(null);

  const checkIn = useFaceCheckIn();
  const { fetchCoords } = useLocation();

  // Activate the camera only while this tab is focused — avoids holding the camera in background.
  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      return () => setCameraActive(false);
    }, []),
  );

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
        base64: false,
      });
      if (!photo?.uri) throw new Error(t('checkin.captureFailed'));
      const coords = await fetchCoords();
      const result = await checkIn.mutateAsync({ photoUri: photo.uri, coords });
      setLastResult(result);
      Toast.show({
        type: 'success',
        text1: result.message ?? t('checkin.success'),
        text2: result.user ? `${result.user.name}` : undefined,
      });
    } catch (error) {
      setLastResult(null);
      Toast.show({
        type: 'error',
        text1: t('checkin.rejected'),
        text2: humanizeApiError(error),
      });
    }
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator color="#fff" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-surface-light dark:bg-surface-dark">
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <View className="h-20 w-20 rounded-full bg-primary/10 items-center justify-center">
            <Ionicons name="camera" size={36} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-bold text-center text-slate-900 dark:text-white">
            {t('checkin.enableCamera')}
          </Text>
          <Text className="text-base text-center text-slate-500 dark:text-slate-400">
            {t('checkin.cameraPermissionMessage')}
          </Text>
          <Button label={t('checkin.allowCamera')} onPress={() => void requestPermission()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {cameraActive ? (
        <CameraView 
          ref={cameraRef} 
          style={{ flex: 1 }} 
          facing="front" 
          mode="picture"
        />
      ) : (
        <View className="flex-1 bg-black" />
      )}

      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        <View className="h-72 w-56 rounded-[140px] border-[3px] border-white/70" />
      </View>

      <SafeAreaView className="absolute inset-x-0 top-0">
        <View className="px-6 pt-4">
          <Text className="text-xs uppercase tracking-widest text-white/70">
            {t('common.appName')}
          </Text>
          <Text className="mt-1 text-3xl font-bold text-white">{t('checkin.title')}</Text>
          <Text className="mt-1 text-base text-white/80">{t('checkin.tapToCapture')}</Text>
        </View>
      </SafeAreaView>

      <SafeAreaView className="absolute inset-x-0 bottom-0">
        <View className="px-6 pb-6 gap-3">
          {lastResult?.success && lastResult.user ? (
            <View className="rounded-3xl bg-white/95 dark:bg-slate-900/95 p-4 gap-1">
              <Text className="text-xs uppercase tracking-wide text-success">
                {t('checkin.success')}
              </Text>
              <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                {lastResult.user.name}
              </Text>
              {lastResult.user.department ? (
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {lastResult.user.department}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: checkIn.isPending, busy: checkIn.isPending }}
            disabled={checkIn.isPending}
            onPress={handleCapture}
            className={`h-16 rounded-full items-center justify-center ${
              checkIn.isPending ? 'bg-primary/60' : 'bg-primary active:bg-primary-700'
            }`}
          >
            {checkIn.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">{t('checkin.capture')}</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
