// Animated follow-along figure for an exercise.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Line, Circle, Rect } from 'react-native-svg';
import { prepare, sample, drawList, W, H } from '../figure';
import { DEMOS } from '../demos';
import { C } from '../theme';

const TOP = 24; // headroom for jumps / standing on a step

export default function ExerciseDemo({ id, height = 190, compact }) {
  const def = DEMOS[id];
  const prep = useMemo(() => (def ? prepare(def) : null), [id]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const last = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    timeRef.current = 0;
    setT(0);
  }, [id]);

  useEffect(() => {
    if (!prep || !playing) return;
    let raf;
    let lastPaint = 0;
    const loop = (now) => {
      if (last.current != null) timeRef.current += ((now - last.current) / 1000) * speed;
      last.current = now;
      if (now - lastPaint > 33) {
        lastPaint = now;
        setT(timeRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [prep, playing, speed]);

  if (!prep) return null;
  const items = drawList(prep, sample(prep, t));
  const isStatic = prep.frames.length === 1;

  return (
    <View style={{ backgroundColor: '#0B0E13', borderRadius: 14, overflow: 'hidden', marginVertical: 8 }}>
      <Svg width="100%" height={height} viewBox={`0 ${-TOP} ${W} ${H + TOP}`} preserveAspectRatio="xMidYMid meet">
        {items.map((d, i) => {
          if (d.t === 'line')
            return <Line key={i} x1={d.a[0]} y1={d.a[1]} x2={d.b[0]} y2={d.b[1]} stroke={d.color} strokeWidth={d.w} strokeLinecap="round" />;
          if (d.t === 'circle')
            return d.ring ? (
              <Circle key={i} cx={d.c[0]} cy={d.c[1]} r={d.r} fill="none" stroke={d.color} strokeWidth={5} />
            ) : (
              <Circle key={i} cx={d.c[0]} cy={d.c[1]} r={d.r} fill={d.color} />
            );
          if (d.t === 'rect') return <Rect key={i} x={d.x} y={d.y} width={d.w} height={d.h} rx={d.r || 0} fill={d.color} />;
          return null;
        })}
      </Svg>
      {!compact && !isStatic ? (
        <View style={{ flexDirection: 'row', position: 'absolute', right: 8, top: 8 }}>
          <Pill label={playing ? '❚❚' : '▶'} onPress={() => setPlaying(!playing)} />
          <Pill label={speed === 1 ? '1×' : '½×'} onPress={() => setSpeed(speed === 1 ? 0.5 : 1)} />
        </View>
      ) : null}
      {isStatic && !compact ? (
        <Text style={{ position: 'absolute', left: 10, top: 8, color: C.sub, fontSize: 11 }}>Hold this position</Text>
      ) : null}
      {prep.view === 'front' && !compact ? (
        <Text style={{ position: 'absolute', left: 10, top: 8, color: C.sub, fontSize: 11 }}>Front view</Text>
      ) : null}
    </View>
  );
}

function Pill({ label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: '#1F2530', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 6 }}>
      <Text style={{ color: C.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}
