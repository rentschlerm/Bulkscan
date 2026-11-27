import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, Alert, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useStore } from '../store';
import { Card, H, Sub, Btn, Field, WeightChart, CalorieBars } from '../components/ui';
import { C } from '../theme';
import { todayKey, addDays, keyToDate, sumEntries, movingAverage, weightSlope, calibrate, streak } from '../nutrition';

export default function ProgressScreen({ targets }) {
  const store = useStore();
  const { width } = useWindowDimensions();
  const chartW = width - 64;
  const [kg, setKg] = useState('');
  const today = todayKey();
  const weights = store.weights;
  const last = weights[weights.length - 1];
  const first = weights[0];

  const recent = weights.filter((w) => w.date >= addDays(today, -60));
  const avg = useMemo(() => movingAverage(recent), [recent]);
  const slope14 = weightSlope(weights.filter((w) => w.date >= addDays(today, -14)));
  const perWeek = slope14 == null ? null : slope14 * 7;
  const goal = store.profile.goalWeight;
  const cal = useMemo(() => calibrate(store.logs, weights), [store.logs, weights]);

  const week = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDays(today, -i);
    week.push({ key: k, label: 'SMTWTFS'[keyToDate(k).getDay()], kcal: sumEntries(store.logs[k]).kcal });
  }
  const logged = week.filter((d) => d.kcal > 0);
  const avgKcal = logged.length ? Math.round(logged.reduce((a, b) => a + b.kcal, 0) / logged.length) : 0;
  const hitDays = week.filter((d) => d.kcal >= targets.kcal * 0.95).length;

  let eta = null;
  if (goal && last && perWeek && perWeek > 0.02 && goal > last.kg) {
    const weeks = (goal - last.kg) / perWeek;
    const d = new Date();
    d.setDate(d.getDate() + Math.round(weeks * 7));
    eta = d.toDateString().slice(4);
  }

  const save = () => {
    const v = Number(String(kg).replace(',', '.'));
    if (!(v > 25 && v < 300)) return Alert.alert('Enter a valid weight in kg');
    store.addWeight(today, Math.round(v * 10) / 10);
    setKg('');
  };

  let paceMsg = 'Weigh in most mornings for 2 weeks to see your real pace.';
  if (perWeek != null && weights.filter((w) => w.date >= addDays(today, -14)).length >= 4) {
    const want = store.profile.rate;
    if (perWeek < want * 0.5) paceMsg = `Gaining slower than planned (${perWeek.toFixed(2)} vs ${want} kg/wk). Eat ~150–250 kcal more per day, or apply the calibrated target below.`;
    else if (perWeek > want * 1.6) paceMsg = `Gaining faster than planned (${perWeek.toFixed(2)} vs ${want} kg/wk). Fine if you're very underweight; otherwise trim ~150 kcal to limit fat gain.`;
    else paceMsg = `On pace 👍 ${perWeek.toFixed(2)} kg/week (plan: ${want}).`;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H style={{ fontSize: 24 }}>Progress</H>

      <Card>
        <H>Weigh-in</H>
        <Sub style={{ marginBottom: 8 }}>Same time every morning: after the CR, before eating, same clothes.</Sub>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Field
            style={{ flex: 1 }}
            placeholder={last ? `Last: ${last.kg} kg (${last.date.slice(5)})` : 'kg'}
            value={kg}
            onChangeText={setKg}
            keyboardType="numeric"
          />
          <Btn title="Save" onPress={save} />
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Stat label="Now" value={last ? `${last.kg} kg` : '—'} />
          <Stat label="Change" value={first && last ? `${(last.kg - first.kg >= 0 ? '+' : '')}${(last.kg - first.kg).toFixed(1)} kg` : '—'} />
          <Stat label="Goal" value={goal ? `${goal} kg` : '—'} />
        </View>
        <View style={{ marginTop: 12 }}>
          <WeightChart points={recent} avg={avg} goal={goal} width={chartW} />
        </View>
        <Sub style={{ marginTop: 6 }}>Dots = daily weigh-ins · green = 7-day average (ignore daily water swings).</Sub>
        <Text style={{ color: C.text, marginTop: 10 }}>{paceMsg}</Text>
        {eta ? <Text style={{ color: C.accent, marginTop: 6 }}>At this pace you reach {goal} kg around {eta}.</Text> : null}
      </Card>

      <Card>
        <H>Last 7 days</H>
        <CalorieBars days={week} target={targets.kcal} width={chartW} />
        <Sub style={{ marginTop: 6 }}>
          Average {avgKcal} kcal on logged days · target hit {hitDays}/7 days · streak {streak(store.logs)} days
        </Sub>
      </Card>

      <Card style={{ borderColor: cal.ready ? C.accent : C.border }}>
        <H>Accuracy calibration</H>
        <Sub style={{ marginBottom: 8 }}>
          No photo app is perfect — but your scale is. After ~2 weeks, BulkScan compares what you logged with how your weight
          actually moved and works out your real maintenance calories. Any consistent over- or under-estimate from photos cancels out.
        </Sub>
        {cal.ready ? (
          <>
            <Text style={{ color: C.text }}>
              Logged avg {cal.avgIntake} kcal · weight {cal.kgPerWeek >= 0 ? '+' : ''}
              {cal.kgPerWeek} kg/week → your real maintenance ≈ <Text style={{ fontWeight: '800' }}>{cal.tdee} kcal</Text>
            </Text>
            <Text style={{ color: C.accent, marginVertical: 8 }}>
              Suggested target: {cal.tdee + targets.surplus} kcal/day (currently {targets.kcal})
            </Text>
            <Btn
              title="Apply calibrated target"
              onPress={() => {
                store.setSettings({ calibratedTdee: cal.tdee, targetOverride: null });
                Alert.alert('Updated', `New target: ${cal.tdee + targets.surplus} kcal/day`);
              }}
            />
          </>
        ) : (
          <View>
            <Progress label="Days fully logged" have={cal.loggedDays} need={cal.need.loggedDays} />
            <Progress label="Weigh-ins" have={cal.weighIns} need={cal.need.weighIns} />
            <Progress label="Days between first & last weigh-in" have={cal.span} need={cal.need.span} />
          </View>
        )}
        {store.settings.calibratedTdee ? (
          <TouchableOpacity onPress={() => store.setSettings({ calibratedTdee: null })}>
            <Text style={{ color: C.sub, fontSize: 12, marginTop: 8 }}>Using calibrated maintenance {store.settings.calibratedTdee} kcal · tap to reset to formula</Text>
          </TouchableOpacity>
        ) : null}
      </Card>

      <Measurements />

      {weights.length ? (
        <Card>
          <H>History</H>
          {[...weights].reverse().slice(0, 14).map((w) => (
            <TouchableOpacity
              key={w.date}
              onLongPress={() =>
                Alert.alert('Delete weigh-in?', `${w.date}: ${w.kg} kg`, [
                  { text: 'Cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => store.removeWeight(w.date) },
                ])
              }
              style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}
            >
              <Text style={{ color: C.sub }}>{w.date}</Text>
              <Text style={{ color: C.text }}>{w.kg} kg</Text>
            </TouchableOpacity>
          ))}
          <Sub style={{ marginTop: 4 }}>Long-press to delete.</Sub>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: C.sub, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

function Progress({ label, have, need }) {
  const pct = Math.min(1, have / need);
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: C.sub, fontSize: 12 }}>
        {label}: {Math.min(have, need)}/{need}
      </Text>
      <View style={{ height: 6, backgroundColor: C.card2, borderRadius: 3, marginTop: 4 }}>
        <View style={{ width: `${pct * 100}%`, height: 6, backgroundColor: C.accent, borderRadius: 3 }} />
      </View>
    </View>
  );
}

const PARTS = [
  { k: 'arm', label: 'Arm (flexed)' },
  { k: 'chest', label: 'Chest' },
  { k: 'waist', label: 'Waist (at navel)' },
  { k: 'thigh', label: 'Thigh' },
];

function Measurements() {
  const store = useStore();
  const list = store.measurements || [];
  const [v, setV] = useState({});
  const first = list[0];
  const last = list[list.length - 1];
  const save = () => {
    const m = { date: todayKey() };
    for (const p of PARTS) {
      const n = Number(String(v[p.k] || '').replace(',', '.'));
      if (n > 0) m[p.k] = n;
    }
    if (Object.keys(m).length === 1) return Alert.alert('Enter at least one measurement (cm)');
    store.addMeasurement({ ...(list.find((x) => x.date === m.date) || {}), ...m });
    setV({});
  };
  const d = (k) => (first && last && first[k] && last[k] && first !== last ? last[k] - first[k] : null);
  const waist = d('waist');
  const arm = d('arm');
  return (
    <Card>
      <H>Body measurements</H>
      <Sub style={{ marginBottom: 8 }}>
        Every 2 weeks, tape measure, same spot. Arms and chest growing with waist steady = muscle. Waist growing fast = slow the gain a bit.
      </Sub>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {PARTS.map((p) => (
          <Field
            key={p.k}
            style={{ width: '48%' }}
            label={`${p.label}${last?.[p.k] ? ` · last ${last[p.k]}` : ''}`}
            value={v[p.k] || ''}
            onChangeText={(x) => setV((o) => ({ ...o, [p.k]: x }))}
            keyboardType="numeric"
            placeholder="cm"
          />
        ))}
      </View>
      <Btn kind="secondary" title="Save measurements" onPress={save} />
      {list.length > 1 ? (
        <View style={{ marginTop: 10 }}>
          {PARTS.map((p) =>
            d(p.k) != null ? (
              <Text key={p.k} style={{ color: C.text }}>
                {p.label}: {first[p.k]} → {last[p.k]} cm{' '}
                <Text style={{ color: d(p.k) >= 0 ? C.accent : C.danger }}>
                  ({d(p.k) >= 0 ? '+' : ''}
                  {d(p.k).toFixed(1)})
                </Text>
              </Text>
            ) : null
          )}
          {waist != null && arm != null ? (
            <Text style={{ color: C.sub, marginTop: 6 }}>
              {arm > 0 && waist <= arm * 2
                ? 'Looks like quality gain 👍'
                : waist > 0 && (arm <= 0 || waist > arm * 3)
                ? 'Waist is outpacing arms — check you’re training hard and consider a slower gain rate.'
                : ''}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
