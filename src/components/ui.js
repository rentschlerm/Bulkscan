import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Circle, Path, Line, Rect, Text as SvgText } from 'react-native-svg';
import { C } from '../theme';

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function H({ children, style }) {
  return <Text style={[s.h, style]}>{children}</Text>;
}

export function Sub({ children, style }) {
  return <Text style={[s.sub, style]}>{children}</Text>;
}

export function Btn({ title, onPress, kind = 'primary', disabled, loading, style, small }) {
  const bg = kind === 'primary' ? C.accent : kind === 'danger' ? C.danger : C.card2;
  const fg = kind === 'primary' ? '#06281A' : C.text;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[s.btn, small && s.btnSmall, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && { backgroundColor: C.accent, borderColor: C.accent }]}>
      <Text style={{ color: active ? '#06281A' : C.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Field({ label, value, onChangeText, keyboardType = 'default', placeholder, secure, style }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        value={value == null ? '' : String(value)}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={C.sub}
        secureTextEntry={secure}
        style={s.input}
        autoCapitalize="none"
      />
    </View>
  );
}

export function Ring({ value, target, size = 170 }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = target ? Math.min(1, value / target) : 0;
  const over = target && value > target;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.card2} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? C.protein : C.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ color: C.text, fontSize: 34, fontWeight: '800' }}>{Math.round(value)}</Text>
      <Text style={{ color: C.sub, fontSize: 13 }}>of {target} kcal</Text>
    </View>
  );
}

export function MacroBar({ label, value, target, color }) {
  const pct = target ? Math.min(1, value / target) : 0;
  return (
    <View style={{ flex: 1, marginHorizontal: 4 }}>
      <Text style={{ color: C.sub, fontSize: 12 }}>{label}</Text>
      <View style={{ height: 6, backgroundColor: C.card2, borderRadius: 3, marginVertical: 4 }}>
        <View style={{ width: `${pct * 100}%`, height: 6, backgroundColor: color, borderRadius: 3 }} />
      </View>
      <Text style={{ color: C.text, fontSize: 13, fontWeight: '600' }}>
        {Math.round(value)}/{target}g
      </Text>
    </View>
  );
}

// Weight chart: raw weigh-ins as dots, 7-day average as line, optional goal line.
export function WeightChart({ points, avg, goal, width = 320, height = 180 }) {
  if (!points.length) return <Sub>Log your weight to see the chart.</Sub>;
  const pad = 28;
  const all = [...points.map((p) => p.kg), ...(goal ? [goal] : [])];
  let min = Math.min(...all) - 0.5;
  let max = Math.max(...all) + 0.5;
  const n = Math.max(1, points.length - 1);
  const x = (i) => pad + (i / n) * (width - pad - 8);
  const y = (kg) => 8 + (1 - (kg - min) / (max - min)) * (height - 28);
  const path = avg.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  return (
    <Svg width={width} height={height}>
      {[min, (min + max) / 2, max].map((v, i) => (
        <SvgText key={i} x={2} y={y(v) + 4} fill={C.sub} fontSize="10">
          {v.toFixed(1)}
        </SvgText>
      ))}
      {goal ? (
        <Line x1={pad} x2={width - 8} y1={y(goal)} y2={y(goal)} stroke={C.carbs} strokeDasharray="4 4" strokeWidth={1} />
      ) : null}
      {points.map((p, i) => (
        <Circle key={p.date} cx={x(i)} cy={y(p.kg)} r={3} fill={C.sub} />
      ))}
      <Path d={path} stroke={C.accent} strokeWidth={2.5} fill="none" />
      <SvgText x={pad} y={height - 4} fill={C.sub} fontSize="10">
        {points[0].date.slice(5)}
      </SvgText>
      <SvgText x={width - 40} y={height - 4} fill={C.sub} fontSize="10">
        {points[points.length - 1].date.slice(5)}
      </SvgText>
    </Svg>
  );
}

export function CalorieBars({ days, target, width = 320, height = 140 }) {
  const max = Math.max(target * 1.25, ...days.map((d) => d.kcal), 1);
  const bw = (width - 10) / days.length;
  const y = (v) => height - 18 - (v / max) * (height - 26);
  return (
    <Svg width={width} height={height}>
      {days.map((d, i) => {
        const hit = d.kcal >= target * 0.95;
        return (
          <React.Fragment key={d.key}>
            <Rect
              x={5 + i * bw + 4}
              y={y(d.kcal)}
              width={bw - 8}
              height={Math.max(0, height - 18 - y(d.kcal))}
              rx={4}
              fill={d.kcal === 0 ? C.card2 : hit ? C.accent : C.carbs}
            />
            <SvgText x={5 + i * bw + bw / 2} y={height - 4} fill={C.sub} fontSize="10" textAnchor="middle">
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
      <Line x1={5} x2={width - 5} y1={y(target)} y2={y(target)} stroke={C.text} strokeDasharray="4 4" strokeWidth={1} />
    </Svg>
  );
}

export const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  h: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sub: { color: C.sub, fontSize: 13, lineHeight: 18 },
  btn: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { fontWeight: '700', fontSize: 15 },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: C.border, marginRight: 8, marginBottom: 8 },
  label: { color: C.sub, fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: C.card2, color: C.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', alignItems: 'center' },
});
