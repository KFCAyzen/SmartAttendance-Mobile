import * as Device from 'expo-device';
import { Platform } from 'react-native';

export function getDeviceDescriptor(): { deviceName: string; platform: string } {
  const model = Device.modelName ?? Device.deviceName ?? 'Unknown device';
  const brand = Device.brand ? `${Device.brand} ` : '';
  const platform = `${Platform.OS}${Platform.Version ? ` ${Platform.Version}` : ''}`;
  return {
    deviceName: `${brand}${model}`.trim(),
    platform,
  };
}
