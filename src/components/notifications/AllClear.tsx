import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

export function AllClear({ title, body }: { title: string; body: string }) {
  return (
    <View
      className="flex-row items-center gap-[14px] rounded-[28px] border px-[18px] py-4"
      style={{ backgroundColor: 'rgba(22,163,74,0.14)', borderColor: 'rgba(22,163,74,0.22)' }}
    >
      <Animated.View
        entering={ZoomIn.springify().damping(12)}
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          backgroundColor: '#16A34A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="checkmark" size={22} color="#fff" />
      </Animated.View>
      <View className="flex-1">
        <Text className="font-display text-[15.5px] text-ink dark:text-white">{title}</Text>
        <Text className="mt-0.5 font-body text-[12.6px] text-muted dark:text-[#9AA5BE]">{body}</Text>
      </View>
    </View>
  );
}
