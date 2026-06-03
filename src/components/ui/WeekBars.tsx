import { Text, View } from 'react-native';

export interface WeekBarDatum {
  label: string;
  v: number;
}

interface WeekBarsProps {
  data: WeekBarDatum[];
  /** Index de la barre mise en avant (couleur pleine). */
  accentIndex?: number;
  /** Valeur max forcée (sinon = pic des données). */
  max?: number;
  /** Hauteur max d'une barre en px (défaut 64). */
  height?: number;
  /** Remplit la hauteur du parent (barres en %) au lieu d'une hauteur fixe. */
  fill?: boolean;
}

function barClassFor(v: number, isAccent: boolean) {
  return v === 0
    ? 'bg-black/[0.08] dark:bg-white/10'
    : isAccent
      ? 'bg-primary'
      : 'bg-primary/30';
}

/** Mini bar chart hebdo. Barres = vues à hauteur proportionnelle. */
export function WeekBars({ data, accentIndex, max, height = 64, fill = false }: WeekBarsProps) {
  const peak = max ?? Math.max(...data.map((d) => d.v), 1);

  // Mode « remplissage » : la zone des barres prend toute la hauteur dispo du
  // parent (carte en flex-1), barres dimensionnées en pourcentage.
  if (fill) {
    return (
      <View className="flex-1">
        <View className="flex-1 flex-row items-end gap-2">
          {data.map((d, i) => {
            const isAccent = i === accentIndex;
            return (
              <View key={i} className="flex-1 justify-end">
                <View
                  className={`w-full rounded-[7px] ${barClassFor(d.v, isAccent)}`}
                  style={{ height: d.v === 0 ? 3 : `${Math.max(6, (d.v / peak) * 100)}%` }}
                />
              </View>
            );
          })}
        </View>
        <View className="mt-[7px] flex-row gap-2">
          {data.map((d, i) => (
            <Text
              key={i}
              className={`flex-1 text-center text-[10px] font-bodySemibold ${
                i === accentIndex ? 'text-primary' : 'text-muted dark:text-slate-500'
              }`}
            >
              {d.label}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-end gap-2" style={{ height: height + 20 }}>
      {data.map((d, i) => {
        const h = d.v === 0 ? 3 : Math.max(6, (d.v / peak) * height);
        const isAccent = i === accentIndex;
        const barClass =
          d.v === 0
            ? 'bg-black/[0.08] dark:bg-white/10'
            : isAccent
              ? 'bg-primary'
              : 'bg-primary/30';
        return (
          <View key={i} className="flex-1 items-center justify-end gap-[7px]">
            <View className={`w-full rounded-[7px] ${barClass}`} style={{ height: h }} />
            <Text
              className={`text-[10px] font-bodySemibold ${
                isAccent ? 'text-primary' : 'text-muted dark:text-slate-500'
              }`}
            >
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
