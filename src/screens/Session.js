// Live workout player: log sets, rest countdowns, timed holds, swaps, finish summary.
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert, Vibration } from 'react-native';
import { useStore } from '../store';
import { Card, H, Sub, Btn, Chip, s as ui } from '../components/ui';
import ExercisePicker from '../components/ExercisePicker';
import { C } from '../theme';
import { EX, WARMUP, swapOptions } from '../exercises';
import { gearFor, makeExercise, sessionStats, burnKcal, findPRs, fmtTime } from '../workout';
import { scheduleRestEnd, cancelRest } from '../reminders';
import { latestWeight } from '../nutrition';

const READY_SECS = 5;

export default function SessionScreen({ onMinimize, onFinished }) {
  const store = useStore();
  const session = store.activeSession;
  const gear = gearFor(store.settings.workout);
  const [now, setNow] = useState(Date.now());
  const [showCues, setShowCues] = useState(false);
  const [picker, setPicker] = useState(null); // 'swap' | 'add' | null
  const [timed, setTimed] = useState(null); // {ex, set, phase:'ready'|'go', endAt, time}
  const [warmOpen, setWarmOpen] = useState(true);
  const alerted = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const set = (fn) => store.setActiveSession((s) => (s ? fn(s) : s));
  const rest = session?.rest;

  // Rest finished?
  useEffect(() => {
    if (!rest) {
      alerted.current = false;
      return;
    }
    if (now >= rest.endAt && !alerted.current) {
      alerted.current = true;
      Vibration.vibrate([0, 400, 200, 400]);
      set((s) => ({ ...s, rest: null }));
    }
  }, [now, rest]);

  // Timed-set phases
  useEffect(() => {
    if (!timed || now < timed.endAt) return;
    if (timed.phase === 'ready') {
      Vibration.vibrate(250);
      setTimed({ ...timed, phase: 'go', endAt: Date.now() + timed.time * 1000 });
    } else {
      Vibration.vibrate([0, 300, 150, 300, 150, 300]);
      completeSet(timed.ex, timed.set, { time: timed.time });
      setTimed(null);
    }
  }, [now, timed]);

  if (!session) return null;

  const idx = Math.min(session.current || 0, session.exercises.length - 1);
  const item = session.exercises[idx];
  const def = item ? EX[item.id] : null;
  const elapsed = (now - session.startedAt) / 1000;
  const anyDone = session.exercises.some((e) => e.sets.some((s) => s.done));

  function patchSet(exI, setI, patch) {
    set((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => (i !== exI ? e : { ...e, sets: e.sets.map((st, j) => (j === setI ? { ...st, ...patch } : st)) })),
    }));
  }

  async function startRest(seconds, label) {
    if (rest?.notifId) cancelRest(rest.notifId);
    const notifId = await scheduleRestEnd(seconds, label);
    set((s) => ({ ...s, rest: { endAt: Date.now() + seconds * 1000, total: seconds, notifId } }));
  }

  function completeSet(exI, setI, extra = {}) {
    const ex = session.exercises[exI];
    const st = ex.sets[setI];
    const done = !st.done;
    patchSet(exI, setI, { ...extra, done });
    if (!done) return;
    // Copy weight forward to the next unfinished set so you don't retype it.
    const nextIdx = ex.sets.findIndex((x, j) => j > setI && !x.done);
    if (nextIdx >= 0 && st.weight !== '' && ex.sets[nextIdx].weight === '') patchSet(exI, nextIdx, { weight: st.weight });
    const lastOfExercise = nextIdx < 0;
    const nextEx = lastOfExercise ? session.exercises[exI + 1] : ex;
    if (lastOfExercise && !nextEx) return; // workout complete, no rest needed
    startRest(ex.rest || 90, EX[nextEx.id]?.name);
    if (lastOfExercise) set((s) => ({ ...s, current: exI + 1 }));
  }

  function adjustRest(delta) {
    if (!rest) return;
    const endAt = Math.max(Date.now() + 1000, rest.endAt + delta * 1000);
    cancelRest(rest.notifId);
    scheduleRestEnd((endAt - Date.now()) / 1000).then((notifId) => set((s) => (s.rest ? { ...s, rest: { ...s.rest, notifId } } : s)));
    set((s) => ({ ...s, rest: { ...s.rest, endAt, total: Math.max(s.rest.total, (endAt - Date.now()) / 1000) } }));
  }

  function skipRest() {
    if (rest?.notifId) cancelRest(rest.notifId);
    set((s) => ({ ...s, rest: null }));
  }

  function goTo(i) {
    setShowCues(false);
    set((s) => ({ ...s, current: Math.max(0, Math.min(s.exercises.length - 1, i)) }));
  }

  function swap(ex) {
    const fresh = makeExercise(ex, { sets: item.sets.length, reps: item.reps, time: item.time, rest: item.rest }, store.workouts);
    set((s) => ({ ...s, exercises: s.exercises.map((e, i) => (i === idx ? fresh : e)) }));
    setPicker(null);
  }

  function addExercise(ex) {
    const fresh = makeExercise(ex, ex.kind === 'time' ? { sets: 3, time: 30, rest: 45 } : { sets: 3, reps: [8, 12], rest: 90 }, store.workouts);
    set((s) => ({ ...s, exercises: [...s.exercises, fresh], current: s.exercises.length }));
    setPicker(null);
  }

  function addSet() {
    set((s) => ({
      ...s,
      exercises: s.exercises.map((e, i) => {
        if (i !== idx) return e;
        const last = e.sets[e.sets.length - 1] || {};
        return { ...e, sets: [...e.sets, { weight: last.weight ?? '', reps: last.reps ?? '', time: last.time ?? e.time ?? '', done: false }] };
      }),
    }));
  }

  function removeSet() {
    set((s) => ({ ...s, exercises: s.exercises.map((e, i) => (i === idx && e.sets.length > 1 ? { ...e, sets: e.sets.slice(0, -1) } : e)) }));
  }

  function removeExercise() {
    Alert.alert('Remove exercise?', def?.name, [
      { text: 'Cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => set((s) => ({ ...s, exercises: s.exercises.filter((_, i) => i !== idx), current: Math.max(0, idx - 1) })),
      },
    ]);
  }

  function finish() {
    const st = sessionStats(session);
    const finalize = () => {
      if (rest?.notifId) cancelRest(rest.notifId);
      const minutes = Math.min(180, Math.round(elapsed / 60));
      const kg = latestWeight(store.profile, store.weights);
      const kcal = burnKcal(kg, minutes);
      const clean = {
        ...session,
        rest: null,
        finishedAt: Date.now(),
        minutes,
        kcal,
        exercises: session.exercises.filter((e) => e.sets.some((x) => x.done)),
      };
      const prs = findPRs(store.workouts, clean);
      clean.prs = prs;
      store.finishSession(clean);
      onFinished({ ...clean, ...st });
    };
    const discard = () => {
      if (rest?.notifId) cancelRest(rest.notifId);
      store.setActiveSession(null);
      onMinimize();
    };
    if (st.sets === 0) {
      return Alert.alert('No sets logged', 'Discard this workout?', [
        { text: 'Keep going' },
        { text: 'Discard', style: 'destructive', onPress: discard },
      ]);
    }
    const total = session.exercises.reduce((a, e) => a + e.sets.length, 0);
    Alert.alert('Finish workout?', `${st.sets}/${total} sets done.`, [
      { text: 'Keep going' },
      { text: 'Discard', style: 'destructive', onPress: discard },
      { text: 'Finish & save', onPress: finalize },
    ]);
  }

  const isTime = def?.kind === 'time';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={onMinimize} style={{ padding: 6 }}>
          <Text style={{ color: C.sub, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text style={{ color: C.text, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>
            {session.name}
          </Text>
          <Text style={{ color: C.accent, fontSize: 13 }}>⏱ {fmtTime(elapsed)}</Text>
        </View>
        <Btn small title="Finish" onPress={finish} />
      </View>

      {/* Exercise strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, paddingVertical: 8, paddingLeft: 12 }}>
        {session.exercises.map((e, i) => {
          const all = e.sets.every((x) => x.done);
          return <Chip key={e.id + i} label={`${all ? '✓ ' : ''}${i + 1}. ${EX[e.id]?.name || e.id}`} active={i === idx} onPress={() => goTo(i)} />;
        })}
        <Chip label="+ Add" onPress={() => setPicker('add')} />
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: rest || timed ? 170 : 24 }} keyboardShouldPersistTaps="handled">
        {!anyDone ? (
          <Card>
            <TouchableOpacity onPress={() => setWarmOpen(!warmOpen)}>
              <H style={{ marginBottom: warmOpen ? 8 : 0 }}>🔥 Warm-up (5 min) {warmOpen ? '▾' : '▸'}</H>
            </TouchableOpacity>
            {warmOpen ? (
              <>
                {WARMUP.map((w) => (
                  <Text key={w.name} style={{ color: C.text, marginBottom: 4 }}>
                    • {w.name} <Text style={{ color: C.sub }}>— {w.detail}</Text>
                  </Text>
                ))}
                <Btn small kind="secondary" title="Start 5:00 warm-up timer" style={{ marginTop: 8 }} onPress={() => startRest(300, 'Warm-up done — first exercise')} />
              </>
            ) : null}
          </Card>
        ) : null}

        {item && def ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>{def.name}</Text>
                <Text style={{ color: C.sub, fontSize: 12 }}>
                  {def.muscle} · {isTime ? `${item.time}s holds` : `${item.reps[0]}–${item.reps[1]} reps`} · rest {item.rest}s
                </Text>
              </View>
              <TouchableOpacity onPress={removeExercise} style={{ padding: 4 }}>
                <Text style={{ color: C.sub }}>🗑</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: item.up ? C.accent : C.carbs, marginTop: 8, fontSize: 13 }}>{item.up ? '⬆ ' : '🎯 '}{item.hint}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <Chip label={showCues ? 'Hide form tips' : 'How to do it'} active={showCues} onPress={() => setShowCues(!showCues)} />
              <Chip label="⇄ Swap" onPress={() => setPicker('swap')} />
            </View>
            {showCues ? def.cues.map((c, i) => <Text key={i} style={{ color: C.text, marginBottom: 3 }}>• {c}</Text>) : null}

            {/* Set table */}
            <View style={{ flexDirection: 'row', marginTop: 12, marginBottom: 4 }}>
              <Text style={[hdr, { width: 36 }]}>Set</Text>
              {isTime ? (
                <Text style={[hdr, { flex: 1 }]}>Seconds</Text>
              ) : (
                <>
                  {def.weighted ? <Text style={[hdr, { flex: 1 }]}>kg</Text> : <Text style={[hdr, { flex: 1 }]}>+kg (opt.)</Text>}
                  <Text style={[hdr, { flex: 1 }]}>Reps</Text>
                </>
              )}
              <View style={{ width: 56 }} />
            </View>
            {item.sets.map((st, j) => (
              <View key={j} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, opacity: st.done ? 0.6 : 1 }}>
                <Text style={{ color: C.text, width: 36, fontWeight: '700' }}>{j + 1}</Text>
                {isTime ? (
                  <NumIn value={st.time} onChange={(v) => patchSet(idx, j, { time: v })} />
                ) : (
                  <>
                    <NumIn value={st.weight} decimal onChange={(v) => patchSet(idx, j, { weight: v })} placeholder={def.weighted ? 'kg' : '0'} />
                    <NumIn value={st.reps} onChange={(v) => patchSet(idx, j, { reps: v })} placeholder="reps" />
                  </>
                )}
                {isTime && !st.done ? (
                  <TouchableOpacity
                    onPress={() => setTimed({ ex: idx, set: j, phase: 'ready', endAt: Date.now() + READY_SECS * 1000, time: Number(st.time) || item.time || 30 })}
                    style={[check, { backgroundColor: C.protein }]}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>▶</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      if (!isTime && !st.done && !Number(st.reps)) return Alert.alert('Enter your reps first');
                      completeSet(idx, j);
                    }}
                    style={[check, { backgroundColor: st.done ? C.accent : C.card2 }]}
                  >
                    <Text style={{ color: st.done ? '#06281A' : C.sub, fontWeight: '800' }}>✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Btn small kind="secondary" title="+ Set" onPress={addSet} style={{ flex: 1 }} />
              <Btn small kind="secondary" title="− Set" onPress={removeSet} style={{ flex: 1 }} />
              <Btn small kind="secondary" title="Rest now" onPress={() => startRest(item.rest || 90)} style={{ flex: 1 }} />
            </View>
            <Sub style={{ marginTop: 8 }}>
              Stop each set with 1–2 good reps left. Tick ✓ to start the rest timer — it alerts you even with the screen off.
            </Sub>
          </Card>
        ) : (
          <Card>
            <Sub>No exercises. Add one with “+ Add”.</Sub>
          </Card>
        )}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn kind="secondary" title="‹ Previous" disabled={idx === 0} onPress={() => goTo(idx - 1)} style={{ flex: 1 }} />
          {idx < session.exercises.length - 1 ? (
            <Btn kind="secondary" title="Next ›" onPress={() => goTo(idx + 1)} style={{ flex: 1 }} />
          ) : (
            <Btn title="Finish workout" onPress={finish} style={{ flex: 1 }} />
          )}
        </View>
      </ScrollView>

      {/* Rest / timed overlay */}
      {timed ? (
        <Overlay
          color={timed.phase === 'ready' ? C.carbs : C.protein}
          label={timed.phase === 'ready' ? 'Get ready' : `${def?.name || 'Hold'}`}
          seconds={(timed.endAt - now) / 1000}
          total={timed.phase === 'ready' ? READY_SECS : timed.time}
          actions={[{ title: 'Stop', onPress: () => setTimed(null) }]}
        />
      ) : rest ? (
        <Overlay
          color={C.accent}
          label="Rest"
          seconds={(rest.endAt - now) / 1000}
          total={rest.total}
          actions={[
            { title: '−15s', onPress: () => adjustRest(-15) },
            { title: '+15s', onPress: () => adjustRest(15) },
            { title: 'Skip', onPress: skipRest },
          ]}
        />
      ) : null}

      <ExercisePicker
        visible={picker === 'swap'}
        title={`Swap ${def?.name || ''}`}
        only={def ? swapOptions(def, gear) : []}
        onPick={swap}
        onClose={() => setPicker(null)}
      />
      <ExercisePicker visible={picker === 'add'} title="Add exercise" gear={gear} onPick={addExercise} onClose={() => setPicker(null)} />
    </View>
  );
}

function NumIn({ value, onChange, placeholder, decimal }) {
  return (
    <TextInput
      value={value === '' || value == null ? '' : String(value)}
      onChangeText={(v) => onChange(decimal ? v.replace(/[^0-9.]/g, '') : v.replace(/[^0-9]/g, ''))}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      placeholder={placeholder}
      placeholderTextColor={C.sub}
      style={[ui.input, { flex: 1, marginRight: 8, paddingVertical: 8, textAlign: 'center' }]}
    />
  );
}

function Overlay({ color, label, seconds, total, actions }) {
  const pct = total ? Math.max(0, Math.min(1, seconds / total)) : 0;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: color, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.sub, fontSize: 13 }}>{label}</Text>
          <Text style={{ color, fontSize: 44, fontWeight: '800' }}>{fmtTime(Math.ceil(seconds))}</Text>
        </View>
        {actions.map((a) => (
          <Btn key={a.title} small kind="secondary" title={a.title} onPress={a.onPress} style={{ marginLeft: 6 }} />
        ))}
      </View>
      <View style={{ height: 6, backgroundColor: C.card2, borderRadius: 3, marginTop: 8 }}>
        <View style={{ width: `${pct * 100}%`, height: 6, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

const hdr = { color: C.sub, fontSize: 12, textAlign: 'center' };
const check = { width: 48, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' };
