import { View, Text } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

import { FONT } from './theme';
import { useAdminTheme } from './useAdminTheme';

export interface DonutSegment {
  value: number;
  color: string;
}

/** Anneau multi-segments avec valeur au centre (port du composant Donut). */
export function Donut({
  segments,
  size = 130,
  thickness = 16,
  centerTop,
  centerBottom,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerTop: string;
  centerBottom: string;
}) {
  const p = useAdminTheme();
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={p.line}
          strokeWidth={thickness}
        />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, len - 3)} ${c}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: FONT.display,
            fontSize: size * 0.26,
            color: p.ink,
            letterSpacing: -1,
          }}
        >
          {centerTop}
        </Text>
        <Text style={{ fontFamily: FONT.semibold, fontSize: 11.5, color: p.muted }}>
          {centerBottom}
        </Text>
      </View>
    </View>
  );
}

/** Courbe de tendance remplie (port de Sparkline). */
export function Sparkline({
  data,
  width = 150,
  height = 46,
  color,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const p = useAdminTheme();
  const stroke = color ?? p.primary;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * width;
    const y = height - 4 - ((v - min) / span) * (height - 8);
    return [x, y] as const;
  });
  const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#spk)" />
      <Path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={last[0]} cy={last[1]} r={3.4} fill={stroke} />
    </Svg>
  );
}

export interface MiniBar {
  label: string;
  v: number;
}

/** Mini bar-chart hebdomadaire (port de MiniBars). */
export function MiniBars({
  data,
  height = 64,
  accentIndex,
}: {
  data: MiniBar[];
  height?: number;
  accentIndex?: number;
}) {
  const p = useAdminTheme();
  const peak = Math.max(...data.map((d) => d.v), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height }}>
      {data.map((d, i) => {
        const h = Math.max(6, (d.v / peak) * (height - 18));
        const isAccent = i === accentIndex;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
            <View
              style={{
                width: '100%',
                height: h,
                borderRadius: 7,
                backgroundColor:
                  d.v === 0 ? p.line : isAccent ? p.primary : 'rgba(47,91,255,0.28)',
              }}
            />
            <Text
              style={{
                fontFamily: FONT.semibold,
                fontSize: 10,
                color: isAccent ? p.primary : p.muted2,
              }}
            >
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
