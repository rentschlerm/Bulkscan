// Workout logic: build sessions from programs, progression, PRs, calorie burn.
import { EX, EQUIPMENT, PROGRAM, resolve } from './exercises';
import { todayKey, addDays, keyToDate } from './nutrition';

export const DEFAULT_WORKOUT_SETTINGS = {
  setupDone: false,
  where: 'home',
  gear: [],
  programId: 'home-bw',
  days: [1, 3, 5], // 0 = Sunday … 6 = Saturday
  time: '17:30',
  remind: true,
  addBurn: false,
  unit: 'kg',
};

export function gearFor(ws) {
  if (ws.where === 'gym') return EQUIPMENT.map((e) => e.id);
  return ws.gear || [];
}

export function lastPerformance(history, exId) {
  for (let i = history.length - 1; i >= 0; i--) {
    const ex = history[i].exercises.find((x) => x.id === exId);
    if (ex && ex.sets.some((s) => s.done)) return { date: history[i].date, sets: ex.sets.filter((s) => s.done) };
  }
  return null;
}

function weightStep(ex) {
  if (ex.needs.includes('bb')) return 2.5;
  if (ex.needs.includes('gym')) return 2.5;
  if (ex.needs.includes('db')) return 1; // per dumbbell
  return 0;
}

/** Double progression: work up to the top of the rep range, then add weight. */
export function suggest(ex, item, last) {
  if (!last) {
    if (ex.kind === 'time') return { text: `Start with ${item.time}s holds`, weight: '', reps: '', time: item.time };
    return {
      text: ex.weighted ? `First time: pick a weight you can lift ${item.reps[1]}× with 2 reps left in the tank` : `Aim for ${item.reps[0]}–${item.reps[1]} reps`,
      weight: '',
      reps: item.reps ? item.reps[0] : '',
    };
  }
  if (ex.kind === 'time') {
    const best = Math.max(...last.sets.map((s) => Number(s.time) || 0));
    const all = last.sets.every((s) => Number(s.time) >= (item.time || 30));
    const next = all ? best + 5 : best || item.time;
    return { text: all ? `Last best ${best}s → try ${next}s` : `Last best ${best}s — match it`, time: next };
  }
  const [lo, hi] = item.reps || [8, 12];
  const w = Math.max(...last.sets.map((s) => Number(s.weight) || 0));
  const topSets = last.sets.filter((s) => (Number(s.weight) || 0) === w);
  const minReps = Math.min(...topSets.map((s) => Number(s.reps) || 0));
  const lastTxt = `Last: ${topSets.map((s) => s.reps).join(', ')} reps${w ? ` @ ${w} kg` : ''}`;
  const step = weightStep(ex);
  if (minReps >= hi && topSets.length >= Math.min(item.sets, last.sets.length)) {
    if (step) return { text: `${lastTxt} → add weight: ${w + step} kg × ${lo}+`, weight: w + step, reps: lo, up: true };
    return { text: `${lastTxt} → you've outgrown the range. Go slower (3 s down) or try a harder variation.`, weight: '', reps: hi, up: true };
  }
  return { text: `${lastTxt} → same weight, beat ${minReps} reps`, weight: w || '', reps: Math.min(hi, minReps + 1) };
}

export function buildSession({ day, gear, history, programId, dayIndex, name }) {
  const exercises = [];
  for (const item of day.items) {
    const ex = resolve(item.id, gear);
    if (!ex) continue;
    if (exercises.some((x) => x.id === ex.id)) continue;
    exercises.push(makeExercise(ex, item, history));
  }
  return {
    id: Date.now().toString(36),
    name: name || day.name,
    programId: programId || null,
    dayIndex: dayIndex ?? null,
    date: todayKey(),
    startedAt: Date.now(),
    exercises,
    current: 0,
  };
}

export function makeExercise(ex, item, history) {
  const fixed = ex.kind === 'time' ? { time: item.time || 30 } : { reps: item.reps || [8, 12] };
  const it = { sets: item.sets || 3, rest: item.rest || 90, ...fixed };
  const last = lastPerformance(history, ex.id);
  const sug = suggest(ex, it, last);
  return {
    id: ex.id,
    ...it,
    hint: sug.text,
    up: !!sug.up,
    sets: Array.from({ length: it.sets }, () => ({
      weight: sug.weight ?? '',
      reps: sug.reps ?? '',
      time: sug.time ?? it.time ?? '',
      done: false,
    })),
  };
}

export function e1rm(weight, reps) {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (!w || !r) return 0;
  return w * (1 + r / 30);
}

export function sessionStats(s) {
  let sets = 0;
  let volume = 0;
  for (const ex of s.exercises) {
    for (const st of ex.sets) {
      if (!st.done) continue;
      sets++;
      volume += (Number(st.weight) || 0) * (Number(st.reps) || 0);
    }
  }
  return { sets, volume: Math.round(volume) };
}

// Resistance training ≈ 5 METs while you're in the session (incl. rest).
export function burnKcal(kg, minutes) {
  return Math.round((5 * kg * minutes) / 60);
}

export function findPRs(history, session) {
  const prs = [];
  for (const ex of session.exercises) {
    const def = EX[ex.id];
    const done = ex.sets.filter((s) => s.done);
    if (!done.length) continue;
    const prev = history.filter((h) => h.id !== session.id).flatMap((h) => h.exercises.filter((x) => x.id === ex.id).flatMap((x) => x.sets.filter((s) => s.done)));
    if (!prev.length) continue;
    if (def?.kind === 'time') {
      const now = Math.max(...done.map((s) => Number(s.time) || 0));
      const before = Math.max(...prev.map((s) => Number(s.time) || 0));
      if (now > before) prs.push(`${def.name}: ${now}s hold`);
    } else if (done.some((s) => Number(s.weight))) {
      const now = Math.max(...done.map((s) => e1rm(s.weight, s.reps)));
      const before = Math.max(...prev.map((s) => e1rm(s.weight, s.reps)));
      if (now > before + 0.1) {
        const best = done.reduce((a, s) => (e1rm(s.weight, s.reps) > e1rm(a.weight, a.reps) ? s : a));
        prs.push(`${def?.name}: ${best.weight} kg × ${best.reps}`);
      }
    } else {
      const now = Math.max(...done.map((s) => Number(s.reps) || 0));
      const before = Math.max(...prev.map((s) => Number(s.reps) || 0));
      if (now > before) prs.push(`${def?.name}: ${now} reps`);
    }
  }
  return prs;
}

export function bestLifts(history) {
  const best = {};
  for (const h of history) {
    for (const ex of h.exercises) {
      for (const s of ex.sets) {
        if (!s.done || !Number(s.weight)) continue;
        const v = e1rm(s.weight, s.reps);
        if (!best[ex.id] || v > best[ex.id].e1rm) best[ex.id] = { e1rm: v, weight: s.weight, reps: s.reps, date: h.date };
      }
    }
  }
  return Object.entries(best)
    .map(([id, b]) => ({ id, name: EX[id]?.name || id, ...b }))
    .sort((a, b) => b.e1rm - a.e1rm);
}

export function nextDayIndex(history, programId) {
  const p = PROGRAM[programId];
  if (!p) return 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].programId === programId && history[i].dayIndex != null) return (history[i].dayIndex + 1) % p.days.length;
  }
  return 0;
}

export function weekKeyStart(key = todayKey()) {
  const d = keyToDate(key);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(key, -dow);
}

export function thisWeekCount(history) {
  const start = weekKeyStart();
  return history.filter((h) => h.date >= start).length;
}

// Consecutive weeks (Mon–Sun) with at least `goal` workouts, counting this week if already met.
export function weekStreak(history, goal) {
  if (!goal) return 0;
  let start = weekKeyStart();
  let n = 0;
  const count = (s) => history.filter((h) => h.date >= s && h.date < addDays(s, 7)).length;
  if (count(start) < goal) start = addDays(start, -7);
  while (count(start) >= goal) {
    n++;
    start = addDays(start, -7);
  }
  return n;
}

export function burnedOn(history, key) {
  return history.filter((h) => h.date === key).reduce((a, h) => a + (h.kcal || 0), 0);
}

export function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
