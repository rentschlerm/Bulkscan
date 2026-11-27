import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, Switch, Modal, TextInput } from 'react-native';
import { useStore, newId } from '../store';
import { Card, H, Sub, Btn, Chip, Field, s as ui } from '../components/ui';
import ExercisePicker from '../components/ExercisePicker';
import SessionScreen from './Session';
import { C } from '../theme';
import { EQUIPMENT, EX, PROGRAMS, PROGRAM, recommendProgram, resolve } from '../exercises';
import { gearFor, buildSession, nextDayIndex, thisWeekCount, weekStreak, bestLifts, weekKeyStart, fmtTime } from '../workout';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WorkoutScreen() {
  const store = useStore();
  const ws = store.settings.workout;
  const [view, setView] = useState(ws.setupDone ? 'home' : 'setup');
  const [inSession, setInSession] = useState(!!store.activeSession);
  const [summary, setSummary] = useState(null);

  if (inSession && store.activeSession) {
    return (
      <SessionScreen
        onMinimize={() => setInSession(false)}
        onFinished={(s) => {
          setInSession(false);
          setSummary(s);
        }}
      />
    );
  }
  if (view === 'setup') return <Setup onDone={() => setView('home')} />;
  if (view === 'builder') return <Builder onDone={() => setView('home')} />;

  const start = (day, extra) => {
    const go = () => {
      store.setActiveSession(buildSession({ day, gear: gearFor(ws), history: store.workouts, ...extra }));
      setInSession(true);
    };
    if (store.activeSession) {
      Alert.alert('Workout in progress', 'Discard it and start a new one?', [
        { text: 'Cancel' },
        { text: 'Discard & start', style: 'destructive', onPress: go },
      ]);
    } else go();
  };

  return (
    <>
      <Home
        onStart={start}
        onResume={() => setInSession(true)}
        onSetup={() => setView('setup')}
        onBuild={() => setView('builder')}
      />
      <Modal visible={!!summary} transparent animationType="fade" onRequestClose={() => setSummary(null)}>
        <View style={{ flex: 1, backgroundColor: '#000a', justifyContent: 'center', padding: 24 }}>
          <Card>
            <H style={{ fontSize: 22 }}>Workout done 💪</H>
            {summary ? (
              <>
                <Text style={{ color: C.text, marginBottom: 6 }}>
                  {summary.name} · {summary.minutes} min · {summary.sets} sets{summary.volume ? ` · ${summary.volume.toLocaleString()} kg lifted` : ''}
                </Text>
                <Text style={{ color: C.accent, marginBottom: 6 }}>~{summary.kcal} kcal burned</Text>
                {summary.prs?.length ? (
                  <>
                    <Text style={{ color: C.carbs, fontWeight: '700', marginTop: 6 }}>🏆 New personal records</Text>
                    {summary.prs.map((p) => (
                      <Text key={p} style={{ color: C.text }}>• {p}</Text>
                    ))}
                  </>
                ) : null}
                <Sub style={{ marginTop: 10 }}>
                  {store.settings.workout.addBurn
                    ? `Your food target today went up by ${summary.kcal} kcal. Eat it back — muscles need it to grow.`
                    : 'Now eat: a meal with 30–40 g protein in the next couple of hours helps recovery.'}
                </Sub>
              </>
            ) : null}
            <Btn title="Nice" onPress={() => setSummary(null)} style={{ marginTop: 12 }} />
          </Card>
        </View>
      </Modal>
    </>
  );
}

function Home({ onStart, onResume, onSetup, onBuild }) {
  const store = useStore();
  const ws = store.settings.workout;
  const gear = gearFor(ws);
  const program = PROGRAM[ws.programId] || PROGRAMS[0];
  const nextIdx = nextDayIndex(store.workouts, program.id);
  const nextDay = program.days[nextIdx];
  const [library, setLibrary] = useState(false);
  const [openId, setOpenId] = useState(null);
  const week = thisWeekCount(store.workouts);
  const goal = ws.days.length || program.perWeek;
  const streak = weekStreak(store.workouts, goal);
  const weekBurn = store.workouts.filter((w) => w.date >= weekKeyStart()).reduce((a, w) => a + (w.kcal || 0), 0);
  const lifts = useMemo(() => bestLifts(store.workouts).slice(0, 8), [store.workouts]);
  const preview = nextDay.items.map((it) => ({ ex: resolve(it.id, gear), it })).filter((x) => x.ex);
  const todayIsDay = ws.days.includes(new Date().getDay());

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <H style={{ fontSize: 24 }}>Workout</H>
        <TouchableOpacity onPress={onSetup}>
          <Text style={{ color: C.accent }}>Plan & reminders</Text>
        </TouchableOpacity>
      </View>

      {store.activeSession ? (
        <Card style={{ borderColor: C.accent }}>
          <H>⏱ {store.activeSession.name} in progress</H>
          <Sub style={{ marginBottom: 8 }}>Started {fmtTime((Date.now() - store.activeSession.startedAt) / 1000)} ago</Sub>
          <Btn title="Resume workout" onPress={onResume} />
        </Card>
      ) : null}

      <Card>
        <Sub>{todayIsDay ? 'Today is a workout day' : 'Up next'} · {program.name}</Sub>
        <H style={{ fontSize: 20, marginTop: 2 }}>{nextDay.name}</H>
        {preview.map(({ ex, it }, i) => (
          <Text key={ex.id + i} style={{ color: C.text, marginBottom: 2 }}>
            • {ex.name} <Text style={{ color: C.sub }}>{it.time ? `${it.sets}×${it.time}s` : `${it.sets}×${it.reps[0]}–${it.reps[1]}`}</Text>
          </Text>
        ))}
        <Btn title="Start workout" style={{ marginTop: 10 }} onPress={() => onStart(nextDay, { programId: program.id, dayIndex: nextIdx })} />
        {program.days.length > 1 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
            <Sub style={{ width: '100%', marginBottom: 6 }}>Or pick a day:</Sub>
            {program.days.map((d, i) => (
              <Chip key={d.name} label={d.name} active={i === nextIdx} onPress={() => onStart(d, { programId: program.id, dayIndex: i })} />
            ))}
          </View>
        ) : null}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="This week" value={`${week}/${goal}`} />
          <Stat label="Week streak" value={`${streak} 🔥`} />
          <Stat label="Burned" value={`${weekBurn}`} sub="kcal this wk" />
        </View>
      </Card>

      <Card>
        <H>Quick & custom</H>
        <Btn kind="secondary" title="⚡ 20-min express (no equipment)" onPress={() => onStart(PROGRAM.express.days[0], { name: '20-min express' })} />
        {store.routines.map((r) => (
          <TouchableOpacity
            key={r.id}
            onPress={() => onStart({ name: r.name, items: r.items }, { name: r.name })}
            onLongPress={() =>
              Alert.alert('Delete routine?', r.name, [
                { text: 'Cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => store.removeRoutine(r.id) },
              ])
            }
            style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}
          >
            <Text style={{ color: C.text, fontWeight: '700' }}>▶ {r.name}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>{r.items.map((i) => EX[i.id]?.name).join(', ')}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Btn small kind="secondary" title="+ Build your own" onPress={onBuild} style={{ flex: 1 }} />
          <Btn small kind="secondary" title="📖 Exercise library" onPress={() => setLibrary(true)} style={{ flex: 1 }} />
        </View>
      </Card>

      {lifts.length ? (
        <Card>
          <H>Best lifts</H>
          {lifts.map((l) => (
            <View key={l.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ color: C.text, flex: 1 }}>{l.name}</Text>
              <Text style={{ color: C.sub }}>
                {l.weight} kg × {l.reps} <Text style={{ color: C.accent }}>(~{Math.round(l.e1rm)} max)</Text>
              </Text>
            </View>
          ))}
          <Sub style={{ marginTop: 4 }}>“max” = estimated 1-rep max. Watch it climb.</Sub>
        </Card>
      ) : null}

      <Card>
        <H>History</H>
        {store.workouts.length === 0 ? <Sub>Finished workouts show up here.</Sub> : null}
        {[...store.workouts].reverse().slice(0, 15).map((w) => (
          <TouchableOpacity
            key={w.id}
            onPress={() => setOpenId(openId === w.id ? null : w.id)}
            onLongPress={() =>
              Alert.alert('Delete workout?', `${w.date} · ${w.name}`, [
                { text: 'Cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => store.removeWorkout(w.id) },
              ])
            }
            style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: C.text, fontWeight: '700' }}>
                {w.name}
                {w.prs?.length ? ' 🏆' : ''}
              </Text>
              <Text style={{ color: C.sub }}>{w.date.slice(5)}</Text>
            </View>
            <Text style={{ color: C.sub, fontSize: 12 }}>
              {w.minutes} min · {w.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)} sets · ~{w.kcal} kcal
            </Text>
            {openId === w.id
              ? w.exercises.map((e) => (
                  <Text key={e.id} style={{ color: C.text, fontSize: 13, marginTop: 3 }}>
                    {EX[e.id]?.name}:{' '}
                    <Text style={{ color: C.sub }}>
                      {e.sets
                        .filter((s) => s.done)
                        .map((s) => (s.time && !s.reps ? `${s.time}s` : `${s.weight ? s.weight + '×' : ''}${s.reps}`))
                        .join(', ')}
                    </Text>
                  </Text>
                ))
              : null}
          </TouchableOpacity>
        ))}
        {store.workouts.length ? <Sub style={{ marginTop: 6 }}>Tap to expand · long-press to delete.</Sub> : null}
      </Card>

      <Card>
        <H>Bulking rules that matter</H>
        <Sub>
          • Get stronger over time: add a rep or a little weight whenever the app says ⬆.{'\n'}• Train each muscle about 2× a week.{'\n'}• Sleep 7–9 h — muscle grows while you rest.{'\n'}• Hit your protein target every day.{'\n'}• Sharp pain (not burn) = stop that exercise and swap it.
        </Sub>
      </Card>

      <ExercisePicker visible={library} title="Exercise library" gear={gear} onClose={() => setLibrary(false)} />
    </ScrollView>
  );
}

function Stat({ label, value, sub }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: C.sub, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>{value}</Text>
      {sub ? <Text style={{ color: C.sub, fontSize: 11 }}>{sub}</Text> : null}
    </View>
  );
}

function Setup({ onDone }) {
  const store = useStore();
  const [w, setW] = useState(store.settings.workout);
  const set = (patch) => setW((x) => ({ ...x, ...patch }));
  const gear = w.where === 'gym' ? EQUIPMENT.map((e) => e.id) : w.gear;
  const rec = recommendProgram(w.where, gear, w.days.length);
  const programs = PROGRAMS.filter((p) => p.id !== 'express' && (w.where === 'gym' || p.where === 'home'));

  const toggleGear = (id) => set({ gear: w.gear.includes(id) ? w.gear.filter((g) => g !== id) : [...w.gear, id] });
  const toggleDay = (d) => set({ days: w.days.includes(d) ? w.days.filter((x) => x !== d) : [...w.days, d].sort() });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H style={{ fontSize: 24 }}>Your training plan</H>
      <Sub style={{ marginBottom: 12 }}>
        Eating in a surplus without training mostly adds fat. Lifting tells your body to turn those extra calories into muscle.
      </Sub>

      <Card>
        <H>Where do you train?</H>
        <View style={{ flexDirection: 'row' }}>
          <Chip label="🏠 Home" active={w.where === 'home'} onPress={() => set({ where: 'home', programId: recommendProgram('home', w.gear, w.days.length) })} />
          <Chip label="🏋 Gym" active={w.where === 'gym'} onPress={() => set({ where: 'gym', programId: recommendProgram('gym', [], w.days.length) })} />
        </View>
        {w.where === 'home' ? (
          <>
            <Sub style={{ marginVertical: 6 }}>What do you have? (bodyweight always included)</Sub>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {EQUIPMENT.filter((e) => e.id !== 'gym').map((e) => (
                <Chip key={e.id} label={e.label} active={w.gear.includes(e.id)} onPress={() => toggleGear(e.id)} />
              ))}
            </View>
            <Sub>Missing something? Exercises auto-swap to what you have (no bench → floor press, no bar → table rows).</Sub>
          </>
        ) : null}
      </Card>

      <Card>
        <H>Workout days & reminder</H>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {DOW.map((d, i) => (
            <Chip key={d} label={d} active={w.days.includes(i)} onPress={() => toggleDay(i)} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Text style={{ color: C.text, flex: 1 }}>Remind me at</Text>
          <TextInput
            defaultValue={w.time}
            onEndEditing={(e) => {
              const t = e.nativeEvent.text;
              if (/^\d{1,2}:\d{2}$/.test(t)) set({ time: t });
              else Alert.alert('Use 24-hour time like 17:30');
            }}
            keyboardType="numbers-and-punctuation"
            style={[ui.input, { width: 72, paddingVertical: 6, marginRight: 10, textAlign: 'center' }]}
          />
          <Switch value={w.remind} onValueChange={(v) => set({ remind: v })} trackColor={{ true: C.accent }} />
        </View>
        <Sub style={{ marginTop: 6 }}>3 days is plenty to start. Leave a rest day between full-body days.</Sub>
      </Card>

      <Card>
        <H>Program</H>
        {programs.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => set({ programId: p.id })}
            style={{ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: w.programId === p.id ? C.accent : C.border, marginBottom: 8 }}
          >
            <Text style={{ color: C.text, fontWeight: '700' }}>
              {w.programId === p.id ? '● ' : '○ '}
              {p.name}
              {p.id === rec ? <Text style={{ color: C.accent }}>  · recommended</Text> : null}
            </Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>
              {p.level} · {p.perWeek}×/week · {p.about}
            </Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: C.text, flex: 1, fontWeight: '700' }}>Add workout calories to my food target</Text>
          <Switch value={w.addBurn} onValueChange={(v) => set({ addBurn: v })} trackColor={{ true: C.accent }} />
        </View>
        <Sub style={{ marginTop: 4 }}>
          Turn on if your profile activity level is “Sedentary” or “Light” — then training days get extra food so the surplus isn’t eaten up.
          Leave off if you already picked a higher activity level (it already includes your training).
        </Sub>
      </Card>

      <Btn
        title="Save plan"
        onPress={() => {
          if (!w.days.length) return Alert.alert('Pick at least one workout day');
          store.setWorkoutSettings({ ...w, setupDone: true });
          onDone();
        }}
      />
      {store.settings.workout.setupDone ? <Btn kind="secondary" title="Cancel" onPress={onDone} style={{ marginTop: 8, marginBottom: 24 }} /> : null}
    </ScrollView>
  );
}

function Builder({ onDone }) {
  const store = useStore();
  const gear = gearFor(store.settings.workout);
  const [name, setName] = useState('');
  const [items, setItems] = useState([]);
  const [picking, setPicking] = useState(false);
  const setItem = (i, patch) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const save = () => {
    if (!name.trim() || !items.length) return Alert.alert('Add a name and at least one exercise');
    const clean = items.map((it) => {
      const ex = EX[it.id];
      const base = { id: it.id, sets: Number(it.sets) || 3, rest: Number(it.rest) || 90 };
      return ex.kind === 'time' ? { ...base, time: Number(it.time) || 30 } : { ...base, reps: [Number(it.lo) || 8, Math.max(Number(it.hi) || 12, Number(it.lo) || 8)] };
    });
    store.saveRoutine({ id: 'r-' + newId(), name: name.trim(), items: clean });
    onDone();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H style={{ fontSize: 24 }}>Build a routine</H>
      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Arms day" />
      {items.map((it, i) => {
        const ex = EX[it.id];
        return (
          <Card key={i}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: C.text, fontWeight: '700', flex: 1 }}>{ex.name}</Text>
              <TouchableOpacity onPress={() => setItems((xs) => xs.filter((_, j) => j !== i))}>
                <Text style={{ color: C.sub }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              <Field style={{ flex: 1 }} label="Sets" value={it.sets} onChangeText={(v) => setItem(i, { sets: v })} keyboardType="number-pad" />
              {ex.kind === 'time' ? (
                <Field style={{ flex: 2 }} label="Seconds" value={it.time} onChangeText={(v) => setItem(i, { time: v })} keyboardType="number-pad" />
              ) : (
                <>
                  <Field style={{ flex: 1 }} label="Min reps" value={it.lo} onChangeText={(v) => setItem(i, { lo: v })} keyboardType="number-pad" />
                  <Field style={{ flex: 1 }} label="Max reps" value={it.hi} onChangeText={(v) => setItem(i, { hi: v })} keyboardType="number-pad" />
                </>
              )}
              <Field style={{ flex: 1 }} label="Rest s" value={it.rest} onChangeText={(v) => setItem(i, { rest: v })} keyboardType="number-pad" />
            </View>
          </Card>
        );
      })}
      <Btn kind="secondary" title="+ Add exercise" onPress={() => setPicking(true)} style={{ marginBottom: 8 }} />
      <Btn title="Save routine" onPress={save} />
      <Btn kind="secondary" title="Cancel" onPress={onDone} style={{ marginTop: 8, marginBottom: 24 }} />
      <ExercisePicker
        visible={picking}
        title="Add exercise"
        gear={gear}
        onClose={() => setPicking(false)}
        onPick={(ex) => {
          setItems((xs) => [...xs, ex.kind === 'time' ? { id: ex.id, sets: '3', time: '30', rest: '45' } : { id: ex.id, sets: '3', lo: '8', hi: '12', rest: '90' }]);
          setPicking(false);
        }}
      />
    </ScrollView>
  );
}
