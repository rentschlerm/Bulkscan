// Exercise library + ready-made programs for building muscle while gaining weight.
// needs: equipment required. bw = nothing. db = dumbbells, bench, bar = pull-up bar,
// band = resistance band, bb = barbell & rack, gym = cables/machines.

export const EQUIPMENT = [
  { id: 'db', label: 'Dumbbells' },
  { id: 'bench', label: 'Bench' },
  { id: 'bar', label: 'Pull-up bar' },
  { id: 'band', label: 'Resistance band' },
  { id: 'bb', label: 'Barbell & rack' },
  { id: 'gym', label: 'Cables & machines' },
];

export const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Cardio'];

const X = (id, name, muscle, needs, cues, opts = {}) => ({
  id,
  name,
  muscle,
  needs,
  cues,
  kind: opts.kind || 'reps',
  alts: opts.alts || [],
  weighted: opts.weighted ?? needs.some((n) => ['db', 'bb', 'gym', 'band'].includes(n)),
});

export const EXERCISES = [
  // ---------- Chest ----------
  X('pushup', 'Push-up', 'Chest', [], ['Hands under shoulders, body in one straight line', 'Chest to a fist above the floor', 'Elbows about 45° from your sides'], { alts: ['knee-pushup'] }),
  X('knee-pushup', 'Knee push-up', 'Chest', [], ['Straight line from knees to head', 'Lower slowly, push up hard']),
  X('incline-pushup', 'Incline push-up (hands on table/bed)', 'Chest', [], ['Easier version — good for beginners', 'Chest touches the edge, push away']),
  X('decline-pushup', 'Decline push-up (feet on chair)', 'Chest', [], ['Targets upper chest', 'Keep hips from sagging'], { alts: ['pushup'] }),
  X('db-bench', 'Dumbbell bench press', 'Chest', ['db', 'bench'], ['Shoulder blades squeezed together', 'Lower to chest level over 2 seconds', 'Press up and slightly in'], { alts: ['db-floor-press', 'pushup'] }),
  X('db-floor-press', 'Dumbbell floor press', 'Chest', ['db'], ['Lie on the floor, knees bent', 'Lower until elbows touch the floor', 'Press up'], { alts: ['pushup'] }),
  X('db-incline', 'Incline dumbbell press', 'Chest', ['db', 'bench'], ['Bench at 30–45°', 'Lower to upper chest'], { alts: ['decline-pushup'] }),
  X('db-fly', 'Dumbbell fly', 'Chest', ['db', 'bench'], ['Slight bend in elbows, keep it fixed', 'Open wide until a stretch in the chest', 'Hug a tree to come up'], { alts: ['db-floor-fly'] }),
  X('db-floor-fly', 'Dumbbell floor fly', 'Chest', ['db'], ['Lie on the floor', 'Lower arms until elbows touch the floor'], { alts: ['pushup'] }),
  X('bb-bench', 'Barbell bench press', 'Chest', ['bb', 'bench'], ['Feet planted, slight arch, shoulder blades pinned', 'Bar to lower chest', 'Use a spotter or safety pins'], { alts: ['db-bench', 'pushup'] }),
  X('bb-incline', 'Incline barbell press', 'Chest', ['bb', 'bench'], ['Bench at 30°', 'Bar to upper chest'], { alts: ['db-incline'] }),
  X('machine-chest', 'Chest press machine', 'Chest', ['gym'], ['Handles at mid-chest height', 'Don’t lock elbows hard'], { alts: ['db-bench'] }),
  X('pec-deck', 'Pec deck / cable fly', 'Chest', ['gym'], ['Slow squeeze, 1-second hold', 'Control the way back'], { alts: ['db-fly'] }),
  X('dips', 'Dips (parallel bars)', 'Chest', ['gym'], ['Lean slightly forward for chest', 'Lower until shoulders are at elbow height'], { alts: ['bench-dip'] }),

  // ---------- Back ----------
  X('pullup', 'Pull-up', 'Back', ['bar'], ['Overhand grip, shoulder-width or wider', 'Pull chest toward the bar', 'Full hang at the bottom'], { alts: ['band-row', 'table-row'] }),
  X('chinup', 'Chin-up', 'Back', ['bar'], ['Palms facing you', 'Also hits biceps hard'], { alts: ['table-row'] }),
  X('negative-pullup', 'Negative pull-up (slow lower)', 'Back', ['bar'], ['Jump or step to the top', 'Lower yourself over 3–5 seconds'], { alts: ['table-row'] }),
  X('table-row', 'Inverted row (under a sturdy table)', 'Back', [], ['Lie under a strong table, grip the edge', 'Pull chest to the table, body straight', 'Test the table first!'], { alts: ['superman'] }),
  X('superman', 'Superman', 'Back', [], ['Lie face down, lift arms and legs', 'Hold 2 seconds at the top']),
  X('db-row', 'One-arm dumbbell row', 'Back', ['db'], ['Hand and knee on bench/chair, back flat', 'Pull dumbbell to your hip', 'Squeeze shoulder blade back'], { alts: ['table-row'] }),
  X('db-pullover', 'Dumbbell pullover', 'Back', ['db', 'bench'], ['One dumbbell held with both hands', 'Lower behind head with slightly bent arms', 'Feel the lats stretch'], { alts: ['db-row'] }),
  X('db-shrug', 'Dumbbell shrug', 'Back', ['db'], ['Shoulders straight up to ears', 'Hold 1 second, no rolling']),
  X('band-row', 'Band row', 'Back', ['band'], ['Anchor band at chest height', 'Pull elbows back, squeeze'], { alts: ['table-row'] }),
  X('band-pullapart', 'Band pull-apart', 'Back', ['band'], ['Arms straight in front', 'Pull the band to your chest'], { alts: ['superman'] }),
  X('bb-row', 'Barbell row', 'Back', ['bb'], ['Hinge to about 45°, back flat', 'Pull bar to belly button'], { alts: ['db-row'] }),
  X('deadlift', 'Deadlift', 'Back', ['bb'], ['Bar over mid-foot, hips back, back flat', 'Push the floor away', 'Lock out with glutes, don’t lean back'], { alts: ['db-rdl'] }),
  X('lat-pulldown', 'Lat pulldown', 'Back', ['gym'], ['Pull bar to upper chest', 'Lead with elbows, don’t swing'], { alts: ['pullup', 'band-row'] }),
  X('cable-row', 'Seated cable row', 'Back', ['gym'], ['Chest up, pull handle to belly', 'Shoulders back and down'], { alts: ['db-row'] }),
  X('face-pull', 'Cable face pull', 'Shoulders', ['gym'], ['Rope at face height', 'Pull to your forehead, elbows high'], { alts: ['band-pullapart', 'db-reardelt'] }),

  // ---------- Shoulders ----------
  X('pike-pushup', 'Pike push-up', 'Shoulders', [], ['Hips high, body like an upside-down V', 'Lower head between your hands']),
  X('db-ohp', 'Dumbbell shoulder press', 'Shoulders', ['db'], ['Seated or standing, core tight', 'Press overhead, don’t arch back'], { alts: ['pike-pushup'] }),
  X('db-lateral', 'Lateral raise', 'Shoulders', ['db'], ['Slight bend in elbows', 'Raise to shoulder height, lead with elbows', 'Go light — form beats weight'], { alts: ['band-lateral', 'pike-pushup'] }),
  X('band-lateral', 'Band lateral raise', 'Shoulders', ['band'], ['Stand on the band', 'Raise to shoulder height']),
  X('db-reardelt', 'Rear delt fly', 'Shoulders', ['db'], ['Bend forward, back flat', 'Raise arms out to the side'], { alts: ['band-pullapart'] }),
  X('ohp', 'Barbell overhead press', 'Shoulders', ['bb'], ['Squeeze glutes, bar from upper chest', 'Head through once bar passes'], { alts: ['db-ohp'] }),

  // ---------- Arms ----------
  X('db-curl', 'Dumbbell curl', 'Biceps', ['db'], ['Elbows pinned at your sides', 'Lower slowly, no swinging'], { alts: ['band-curl', 'chinup'] }),
  X('hammer-curl', 'Hammer curl', 'Biceps', ['db'], ['Palms face each other', 'Builds forearms and arm thickness'], { alts: ['db-curl'] }),
  X('band-curl', 'Band curl', 'Biceps', ['band'], ['Stand on the band', 'Squeeze at the top']),
  X('bb-curl', 'Barbell / EZ-bar curl', 'Biceps', ['bb'], ['Elbows still', 'Full stretch at the bottom'], { alts: ['db-curl'] }),
  X('bench-dip', 'Bench/chair dip', 'Triceps', [], ['Hands on a sturdy chair behind you', 'Lower until elbows are at 90°'], { alts: ['diamond-pushup'] }),
  X('diamond-pushup', 'Diamond push-up', 'Triceps', [], ['Hands together under your chest', 'Elbows close to your body'], { alts: ['bench-dip'] }),
  X('db-oh-ext', 'Overhead triceps extension', 'Triceps', ['db'], ['One dumbbell with both hands', 'Lower behind head, elbows point up'], { alts: ['diamond-pushup'] }),
  X('db-skull', 'Dumbbell skull crusher', 'Triceps', ['db'], ['Lie down, arms straight up', 'Bend only at the elbows'], { alts: ['db-oh-ext'] }),
  X('pushdown', 'Cable triceps pushdown', 'Triceps', ['gym'], ['Elbows glued to sides', 'Full lockout, squeeze'], { alts: ['db-oh-ext'] }),

  // ---------- Legs & glutes ----------
  X('squat-bw', 'Bodyweight squat', 'Legs', [], ['Feet shoulder-width, toes slightly out', 'Sit back and down, chest up', 'Thighs at least parallel']),
  X('jump-squat', 'Jump squat', 'Legs', [], ['Squat down, jump explosively', 'Land softly']),
  X('lunge', 'Lunge', 'Legs', [], ['Big step forward', 'Back knee nearly touches floor', 'Push through front heel'], { alts: ['squat-bw'] }),
  X('reverse-lunge', 'Reverse lunge', 'Legs', [], ['Step back, easier on knees', 'Front shin stays vertical']),
  X('bss', 'Bulgarian split squat', 'Legs', [], ['Back foot on a chair/bed', 'Lower straight down', 'Best home leg builder'], { alts: ['lunge'] }),
  X('stepup', 'Step-up', 'Legs', [], ['Use a sturdy chair or step', 'Drive through the top leg only']),
  X('wall-sit', 'Wall sit', 'Legs', [], ['Back flat on wall, thighs parallel', 'Breathe!'], { kind: 'time' }),
  X('calf-raise', 'Calf raise', 'Legs', [], ['On a step edge for full stretch', 'Pause at the top']),
  X('goblet-squat', 'Goblet squat', 'Legs', ['db'], ['Hold one dumbbell at your chest', 'Elbows between knees at the bottom'], { alts: ['squat-bw'] }),
  X('db-rdl', 'Dumbbell Romanian deadlift', 'Legs', ['db'], ['Soft knees, push hips back', 'Dumbbells slide down your thighs', 'Feel the hamstrings stretch, back flat'], { alts: ['glute-bridge'] }),
  X('db-lunge', 'Dumbbell lunge', 'Legs', ['db'], ['Dumbbells at your sides', 'Step and lower under control'], { alts: ['lunge'] }),
  X('db-bss', 'Dumbbell Bulgarian split squat', 'Legs', ['db'], ['Back foot elevated', 'Dumbbells at sides'], { alts: ['bss'] }),
  X('db-calf', 'Dumbbell calf raise', 'Legs', ['db'], ['On a step, one dumbbell', 'Full range']),
  X('back-squat', 'Barbell back squat', 'Legs', ['bb'], ['Bar on upper back, brace your core', 'Break at hips and knees together', 'Use safety pins'], { alts: ['goblet-squat'] }),
  X('bb-rdl', 'Barbell Romanian deadlift', 'Legs', ['bb'], ['Hips back, bar close to legs', 'Stop when back would round'], { alts: ['db-rdl'] }),
  X('leg-press', 'Leg press', 'Legs', ['gym'], ['Feet mid-platform', 'Lower until knees ~90°, don’t lift hips'], { alts: ['goblet-squat'] }),
  X('leg-curl', 'Leg curl machine', 'Legs', ['gym'], ['Slow on the way down'], { alts: ['db-rdl'] }),
  X('leg-ext', 'Leg extension machine', 'Legs', ['gym'], ['Squeeze quads at the top'], { alts: ['bss'] }),
  X('glute-bridge', 'Glute bridge', 'Glutes', [], ['Feet close to butt', 'Drive hips up, squeeze 2 seconds']),
  X('sl-bridge', 'Single-leg glute bridge', 'Glutes', [], ['One foot down, other leg up', 'Keep hips level'], { alts: ['glute-bridge'] }),
  X('hip-thrust', 'Barbell hip thrust', 'Glutes', ['bb', 'bench'], ['Upper back on bench, bar on hips (pad it)', 'Chin tucked, squeeze at top'], { alts: ['sl-bridge'] }),

  // ---------- Core ----------
  X('plank', 'Plank', 'Core', [], ['Elbows under shoulders', 'Squeeze glutes, don’t let hips sag'], { kind: 'time' }),
  X('side-plank', 'Side plank (each side)', 'Core', [], ['Body in a straight line', 'Hips up'], { kind: 'time' }),
  X('crunch', 'Crunch', 'Core', [], ['Lift shoulders, ribs toward hips', 'Don’t pull on your neck']),
  X('leg-raise', 'Lying leg raise', 'Core', [], ['Lower back pressed into floor', 'Lower legs slowly']),
  X('hanging-leg-raise', 'Hanging leg raise', 'Core', ['bar'], ['No swinging', 'Curl pelvis up at the top'], { alts: ['leg-raise'] }),
  X('dead-bug', 'Dead bug', 'Core', [], ['Lower back flat', 'Opposite arm and leg extend slowly']),
  X('hollow-hold', 'Hollow hold', 'Core', [], ['Lower back glued to floor', 'Arms and legs extended'], { kind: 'time' }),
  X('cable-crunch', 'Cable crunch', 'Core', ['gym'], ['Kneel, rope by your head', 'Crunch down with abs, not arms'], { alts: ['crunch'] }),

  // ---------- Cardio / conditioning ----------
  X('jumping-jacks', 'Jumping jacks', 'Cardio', [], ['Light and quick on your feet'], { kind: 'time' }),
  X('mountain-climbers', 'Mountain climbers', 'Cardio', [], ['Plank position, drive knees fast'], { kind: 'time' }),
  X('burpees', 'Burpees', 'Cardio', [], ['Squat, kick back, push-up, jump']),
  X('high-knees', 'High knees', 'Cardio', [], ['Knees to hip height, pump arms'], { kind: 'time' }),
];

export const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function hasGear(ex, gear) {
  return ex.needs.every((n) => gear.includes(n));
}

// Pick the exercise, or the first alternative the user has equipment for.
export function resolve(id, gear, seen = new Set()) {
  const ex = EX[id];
  if (!ex || seen.has(id)) return null;
  if (hasGear(ex, gear)) return ex;
  seen.add(id);
  for (const a of ex.alts) {
    const r = resolve(a, gear, seen);
    if (r) return r;
  }
  return null;
}

export function swapOptions(ex, gear) {
  return EXERCISES.filter((e) => e.muscle === ex.muscle && e.id !== ex.id && hasGear(e, gear) && e.muscle !== 'Cardio');
}

export const WARMUP = [
  { name: 'Jumping jacks or march in place', detail: '60 s' },
  { name: 'Arm circles forward & back', detail: '30 s' },
  { name: 'Bodyweight squats', detail: '10 reps' },
  { name: 'Hip hinges / good mornings', detail: '10 reps' },
  { name: 'Light set of your first exercise', detail: '50% weight' },
];

// ---------- Programs ----------
// s = sets, r = [minReps, maxReps] (double progression range) or t = seconds, rest = seconds
const e = (id, s, r, rest = 90) => ({ id, sets: s, reps: r, rest });
const t = (id, s, sec, rest = 45) => ({ id, sets: s, time: sec, rest });

export const PROGRAMS = [
  {
    id: 'home-bw',
    name: 'Home · Bodyweight full body',
    where: 'home',
    level: 'Beginner',
    perWeek: 3,
    about: 'No equipment. 3 full-body days. Make it harder by slowing down and adding reps.',
    days: [
      { name: 'Full body A', items: [e('pushup', 3, [8, 15]), e('table-row', 3, [8, 15]), e('bss', 3, [8, 12]), e('pike-pushup', 3, [6, 12]), e('glute-bridge', 3, [12, 20], 60), t('plank', 3, 40)] },
      { name: 'Full body B', items: [e('decline-pushup', 3, [6, 12]), e('negative-pullup', 3, [4, 8]), e('reverse-lunge', 3, [10, 15]), e('bench-dip', 3, [8, 15]), e('sl-bridge', 3, [10, 15], 60), e('leg-raise', 3, [10, 15], 45)] },
    ],
  },
  {
    id: 'home-db-fb',
    name: 'Home · Dumbbell full body',
    where: 'home',
    level: 'Beginner–Intermediate',
    perWeek: 3,
    about: 'Dumbbells (bench optional). 3 days a week, alternate A and B.',
    days: [
      { name: 'Full body A', items: [e('goblet-squat', 3, [8, 12], 120), e('db-bench', 3, [8, 12], 120), e('db-row', 3, [8, 12]), e('db-ohp', 3, [8, 12]), e('db-curl', 2, [10, 15], 60), t('plank', 3, 40)] },
      { name: 'Full body B', items: [e('db-rdl', 3, [8, 12], 120), e('db-incline', 3, [8, 12], 120), e('pullup', 3, [5, 10], 120), e('db-lateral', 3, [12, 20], 60), e('db-oh-ext', 2, [10, 15], 60), e('db-bss', 2, [8, 12])] },
    ],
  },
  {
    id: 'home-db-ul',
    name: 'Home · Dumbbell upper/lower',
    where: 'home',
    level: 'Intermediate',
    perWeek: 4,
    about: '4 days: upper, lower, rest, upper, lower. More volume for faster muscle gain.',
    days: [
      { name: 'Upper A', items: [e('db-bench', 4, [6, 10], 120), e('db-row', 4, [8, 12]), e('db-ohp', 3, [8, 12]), e('db-fly', 3, [10, 15], 60), e('db-curl', 3, [10, 15], 60), e('db-skull', 3, [10, 15], 60)] },
      { name: 'Lower A', items: [e('goblet-squat', 4, [8, 12], 120), e('db-rdl', 4, [8, 12], 120), e('db-lunge', 3, [10, 12]), e('db-calf', 4, [12, 20], 45), e('leg-raise', 3, [10, 15], 45)] },
      { name: 'Upper B', items: [e('db-incline', 4, [8, 12], 120), e('pullup', 4, [5, 10], 120), e('db-lateral', 4, [12, 20], 60), e('db-reardelt', 3, [12, 20], 60), e('hammer-curl', 3, [10, 15], 60), e('db-oh-ext', 3, [10, 15], 60)] },
      { name: 'Lower B', items: [e('db-bss', 4, [8, 12], 120), e('sl-bridge', 3, [10, 15]), e('db-rdl', 3, [10, 12]), e('db-calf', 4, [12, 20], 45), t('plank', 3, 45)] },
    ],
  },
  {
    id: 'gym-fb',
    name: 'Gym · Beginner full body',
    where: 'gym',
    level: 'Beginner',
    perWeek: 3,
    about: 'Classic strength base. 3 days, alternate A and B. Add weight whenever you hit the top of the rep range.',
    days: [
      { name: 'Full body A', items: [e('back-squat', 3, [5, 8], 150), e('bb-bench', 3, [5, 8], 150), e('lat-pulldown', 3, [8, 12]), e('db-lateral', 3, [12, 15], 60), e('pushdown', 2, [10, 15], 60)] },
      { name: 'Full body B', items: [e('deadlift', 3, [5, 6], 180), e('ohp', 3, [6, 10], 120), e('cable-row', 3, [8, 12]), e('leg-press', 3, [10, 15], 120), e('db-curl', 2, [10, 15], 60)] },
    ],
  },
  {
    id: 'gym-ul',
    name: 'Gym · Upper/lower',
    where: 'gym',
    level: 'Intermediate',
    perWeek: 4,
    about: '4 days a week. Strength plus size.',
    days: [
      { name: 'Upper (strength)', items: [e('bb-bench', 4, [5, 8], 150), e('bb-row', 4, [6, 10], 120), e('ohp', 3, [6, 10], 120), e('lat-pulldown', 3, [8, 12]), e('bb-curl', 3, [8, 12], 60), e('pushdown', 3, [10, 15], 60)] },
      { name: 'Lower (strength)', items: [e('back-squat', 4, [5, 8], 180), e('bb-rdl', 3, [6, 10], 150), e('leg-press', 3, [10, 15], 120), e('leg-curl', 3, [10, 15], 60), e('calf-raise', 4, [12, 20], 45)] },
      { name: 'Upper (size)', items: [e('db-incline', 4, [8, 12], 120), e('cable-row', 4, [10, 12]), e('db-lateral', 4, [12, 20], 60), e('pec-deck', 3, [12, 15], 60), e('face-pull', 3, [12, 20], 60), e('hammer-curl', 3, [10, 15], 60), e('db-oh-ext', 3, [10, 15], 60)] },
      { name: 'Lower (size)', items: [e('leg-press', 4, [10, 15], 120), e('db-rdl', 3, [10, 12], 120), e('db-bss', 3, [8, 12]), e('leg-ext', 3, [12, 15], 60), e('hip-thrust', 3, [8, 12]), e('cable-crunch', 3, [12, 15], 45)] },
    ],
  },
  {
    id: 'gym-ppl',
    name: 'Gym · Push/Pull/Legs',
    where: 'gym',
    level: 'Intermediate',
    perWeek: 6,
    about: 'Run 3 days (once through) or 6 days (twice through) per week.',
    days: [
      { name: 'Push', items: [e('bb-bench', 4, [6, 10], 150), e('db-incline', 3, [8, 12], 120), e('ohp', 3, [8, 10], 120), e('db-lateral', 4, [12, 20], 60), e('dips', 3, [8, 12]), e('pushdown', 3, [10, 15], 60)] },
      { name: 'Pull', items: [e('deadlift', 3, [5, 6], 180), e('pullup', 3, [6, 10], 120), e('cable-row', 3, [8, 12]), e('face-pull', 3, [12, 20], 60), e('bb-curl', 3, [8, 12], 60), e('hammer-curl', 3, [10, 15], 60)] },
      { name: 'Legs', items: [e('back-squat', 4, [6, 10], 180), e('bb-rdl', 3, [8, 10], 150), e('leg-press', 3, [10, 15], 120), e('leg-curl', 3, [10, 15], 60), e('calf-raise', 4, [12, 20], 45), e('hanging-leg-raise', 3, [10, 15], 60)] },
    ],
  },
  {
    id: 'express',
    name: 'Express · 20-min anywhere',
    where: 'home',
    level: 'Any',
    perWeek: 3,
    about: 'Busy day? A quick circuit beats skipping. Bodyweight only.',
    days: [
      { name: '20-min express', items: [t('jumping-jacks', 1, 60, 15), e('pushup', 3, [8, 20], 45), e('squat-bw', 3, [15, 25], 45), e('table-row', 3, [8, 15], 45), e('reverse-lunge', 2, [10, 15], 45), t('plank', 2, 40, 30)] },
    ],
  },
];

export const PROGRAM = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

export function recommendProgram(where, gear, daysPerWeek) {
  if (where === 'gym') return daysPerWeek >= 5 ? 'gym-ppl' : daysPerWeek >= 4 ? 'gym-ul' : 'gym-fb';
  if (gear.includes('db')) return daysPerWeek >= 4 ? 'home-db-ul' : 'home-db-fb';
  return 'home-bw';
}
