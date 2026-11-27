import React, { useMemo, useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { C } from '../theme';
import { H, Sub, Chip, Btn, Field } from './ui';
import { EXERCISES, MUSCLES, hasGear } from '../exercises';
import ExerciseDemo from './ExerciseDemo';

const GEAR_LABEL = { db: 'dumbbells', bench: 'bench', bar: 'pull-up bar', band: 'band', bb: 'barbell', gym: 'machine' };

export function gearText(ex) {
  return ex.needs.length ? ex.needs.map((n) => GEAR_LABEL[n]).join(' + ') : 'bodyweight';
}

/** Library browser. If onPick is given it's a picker, otherwise read-only with form cues. */
export default function ExercisePicker({ visible, onClose, onPick, gear, title = 'Exercises', only }) {
  const [muscle, setMuscle] = useState(null);
  const [q, setQ] = useState('');
  const [mine, setMine] = useState(true);
  const [open, setOpen] = useState(null);

  const list = useMemo(() => {
    let l = only || EXERCISES;
    if (muscle) l = l.filter((e) => e.muscle === muscle);
    if (mine && gear) l = l.filter((e) => hasGear(e, gear));
    if (q.trim()) l = l.filter((e) => e.name.toLowerCase().includes(q.trim().toLowerCase()));
    return l;
  }, [muscle, q, mine, gear, only]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <H style={{ fontSize: 22 }}>{title}</H>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ color: C.sub, fontSize: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>
        {!only ? (
          <>
            <Field placeholder="Search exercises" value={q} onChangeText={setQ} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 4 }}>
              <Chip label="All" active={!muscle} onPress={() => setMuscle(null)} />
              {MUSCLES.map((m) => (
                <Chip key={m} label={m} active={muscle === m} onPress={() => setMuscle(m)} />
              ))}
            </ScrollView>
            {gear ? <Chip label={mine ? '✓ Only my equipment' : 'Showing all equipment'} active={mine} onPress={() => setMine(!mine)} /> : null}
          </>
        ) : null}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {list.length === 0 ? <Sub>No exercises match.</Sub> : null}
          {list.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              onPress={() => (onPick ? onPick(ex) : setOpen(open === ex.id ? null : ex.id))}
              onLongPress={() => setOpen(open === ex.id ? null : ex.id)}
              style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}
            >
              <Text style={{ color: C.text, fontSize: 15 }}>{ex.name}</Text>
              <Text style={{ color: C.sub, fontSize: 12 }}>
                {ex.muscle} · {gearText(ex)}
                {ex.kind === 'time' ? ' · timed' : ''}
              </Text>
              {open === ex.id ? (
                <>
                  <ExerciseDemo id={ex.id} height={170} />
                  {ex.cues.map((c, i) => (
                    <Text key={i} style={{ color: C.text, fontSize: 13, marginTop: 3 }}>• {c}</Text>
                  ))}
                </>
              ) : null}
            </TouchableOpacity>
          ))}
          <Sub style={{ marginTop: 8 }}>{onPick ? 'Tip: long-press an exercise to watch the demo first.' : 'Tap an exercise to watch the demo and form tips.'}</Sub>
        </ScrollView>
        <Btn kind="secondary" title="Close" onPress={onClose} style={{ marginTop: 8 }} />
      </View>
    </Modal>
  );
}
