import { useColorScheme } from 'nativewind';
import { Pressable, Text, View } from 'react-native';

interface SegmentControlProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

// Styles en `style` (et non `className`) : NativeWind/css-interop plante
// (« navigation context ») quand le className d'un élément change pendant que
// l'onglet bascule. On reproduit fidèlement la maquette en inline + dark mode.
export function SegmentControl<T extends string>({
  value,
  options,
  onChange,
}: SegmentControlProps<T>) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';

  const trackBg = dark ? '#1A2236' : '#F7F8FD';
  const trackBorder = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)';
  const activeBg = dark ? '#121829' : '#FFFFFF';
  const activeText = dark ? '#FFFFFF' : '#0E1326';
  const idleText = dark ? '#94A3B8' : '#717A90';

  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: trackBorder,
        backgroundColor: trackBg,
        padding: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={{
              height: 40,
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 14,
              backgroundColor: active ? activeBg : 'transparent',
              ...(active && !dark
                ? {
                    shadowColor: '#0E1326',
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }
                : null),
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: active
                  ? 'PlusJakartaSans_700Bold'
                  : 'PlusJakartaSans_600SemiBold',
                color: active ? activeText : idleText,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
