// Targets, math and the adaptive calibration that corrects for estimation error.

export const KCAL_PER_KG = 7700; // approx energy in 1 kg of body-weight change

export const ACTIVITY = [
  { key: 1.2, label: 'Sedentary (desk, little exercise)' },
  { key: 1.375, label: 'Light (exercise 1–3x/week)' },
  { key: 1.55, label: 'Moderate (exercise 3–5x/week)' },
  { key: 1.725, label: 'Very active (hard training 6–7x/week)' },
  { key: 1.9, label: 'Physical job + training' },
];

export const RATES = [
  { key: 0.25, label: 'Lean gain · 0.25 kg/week', hint: 'Least fat gained. Best if you lift weights.' },
  { key: 0.35, label: 'Steady · 0.35 kg/week', hint: 'Good balance for most people.' },
  { key: 0.5, label: 'Fast · 0.5 kg/week', hint: 'For very skinny / hard gainers.' },
];

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

export function daysBetween(a, b) {
  return Math.round((keyToDate(b) - keyToDate(a)) / 86400000);
}

export function bmr({ sex, weightKg, heightCm, age }) {
  // Mifflin–St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

export function latestWeight(profile, weights) {
  if (weights && weights.length) return weights[weights.length - 1].kg;
  return profile.weightKg;
}

export function surplusFor(rate) {
  return Math.round((rate * KCAL_PER_KG) / 7);
}

export function computeTargets(profile, weights, settings = {}) {
  const w = latestWeight(profile, weights);
  const tdee = Math.round(bmr({ ...profile, weightKg: w }) * profile.activity);
  const surplus = surplusFor(profile.rate);
  let kcal = tdee + surplus;
  let source = 'formula';
  if (settings.calibratedTdee) {
    kcal = settings.calibratedTdee + surplus;
    source = 'calibrated';
  }
  if (settings.targetOverride) {
    kcal = settings.targetOverride;
    source = 'manual';
  }
  const protein = Math.round(w * 1.8); // g/day, supports muscle gain
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal: Math.round(kcal), protein, fat, carbs, tdee, surplus, source, weight: w };
}

export function sumEntries(entries = []) {
  return entries.reduce(
    (a, e) => ({
      kcal: a.kcal + (e.kcal || 0),
      protein: a.protein + (e.protein || 0),
      carbs: a.carbs + (e.carbs || 0),
      fat: a.fat + (e.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function macrosFromPer100(per100, grams) {
  const f = grams / 100;
  return {
    kcal: Math.round(per100.kcal * f),
    protein: Math.round(per100.protein * f * 10) / 10,
    carbs: Math.round(per100.carbs * f * 10) / 10,
    fat: Math.round(per100.fat * f * 10) / 10,
  };
}

// Least-squares slope of weight (kg) per day.
export function weightSlope(points) {
  if (points.length < 2) return null;
  const t0 = keyToDate(points[0].date).getTime();
  const xs = points.map((p) => (keyToDate(p.date).getTime() - t0) / 86400000);
  const ys = points.map((p) => p.kg);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}

export function movingAverage(weights, days = 7) {
  return weights.map((w) => {
    const from = addDays(w.date, -(days - 1));
    const win = weights.filter((x) => x.date >= from && x.date <= w.date);
    return { date: w.date, kg: win.reduce((a, b) => a + b.kg, 0) / win.length };
  });
}

/**
 * Adaptive calibration.
 * Photo estimates are never perfect, but your scale is. Over 2–3 weeks we compare
 * what you LOGGED with how your weight actually moved, and back-calculate your real
 * maintenance in "your logging units". Any consistent over/under-estimate in the
 * photos cancels out, so the target you hit in the app produces the real gain.
 */
export function calibrate(logs, weights, endKey = todayKey(), windowDays = 21) {
  const startKey = addDays(endKey, -(windowDays - 1));
  const loggedDays = [];
  for (let k = startKey; k <= endKey; k = addDays(k, 1)) {
    const entries = logs[k];
    if (entries && entries.length) {
      const kcal = sumEntries(entries).kcal;
      if (kcal > 600) loggedDays.push(kcal); // ignore days that were clearly half-logged
    }
  }
  const w = weights.filter((x) => x.date >= startKey && x.date <= endKey);
  const span = w.length >= 2 ? daysBetween(w[0].date, w[w.length - 1].date) : 0;
  const ready = loggedDays.length >= 10 && w.length >= 4 && span >= 10;
  if (!ready) {
    return {
      ready: false,
      loggedDays: loggedDays.length,
      weighIns: w.length,
      span,
      need: { loggedDays: 10, weighIns: 4, span: 10 },
    };
  }
  const avgIntake = loggedDays.reduce((a, b) => a + b, 0) / loggedDays.length;
  const slope = weightSlope(w); // kg/day
  const observed = Math.round(avgIntake - slope * KCAL_PER_KG);
  const tdee = Math.min(5000, Math.max(1200, observed));
  return {
    ready: true,
    avgIntake: Math.round(avgIntake),
    kgPerWeek: Math.round(slope * 7 * 100) / 100,
    tdee,
    loggedDays: loggedDays.length,
    weighIns: w.length,
  };
}

export function streak(logs, endKey = todayKey()) {
  let s = 0;
  let k = logs[endKey]?.length ? endKey : addDays(endKey, -1);
  while (logs[k] && logs[k].length) {
    s++;
    k = addDays(k, -1);
  }
  return s;
}
