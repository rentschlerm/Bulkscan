import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Field, Chip, Btn, Sub } from './ui';
import { ACTIVITY, RATES, bmr, surplusFor } from '../nutrition';
import { C } from '../theme';

export default function ProfileForm({ initial, onSave, saveLabel = 'Save' }) {
  const [p, setP] = useState(
    initial || { name: '', sex: 'male', age: '', heightCm: '', weightKg: '', goalWeight: '', activity: 1.375, rate: 0.35 }
  );
  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v }));

  const num = (v) => Number(String(v).replace(',', '.'));
  const valid = num(p.age) > 12 && num(p.heightCm) > 100 && num(p.weightKg) > 25;
  const preview = valid
    ? Math.round(bmr({ sex: p.sex, age: num(p.age), heightCm: num(p.heightCm), weightKg: num(p.weightKg) }) * p.activity) +
      surplusFor(p.rate)
    : null;

  const save = () => {
    if (!valid) return Alert.alert('Missing info', 'Enter your age, height and current weight.');
    onSave({
      ...p,
      age: num(p.age),
      heightCm: num(p.heightCm),
      weightKg: num(p.weightKg),
      goalWeight: p.goalWeight ? num(p.goalWeight) : null,
    });
  };

  return (
    <View>
      <Field label="Name (optional)" value={p.name} onChangeText={set('name')} />
      <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>Sex (for the calorie formula)</Text>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        <Chip label="Male" active={p.sex === 'male'} onPress={() => set('sex')('male')} />
        <Chip label="Female" active={p.sex === 'female'} onPress={() => set('sex')('female')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field style={{ flex: 1 }} label="Age" value={p.age} onChangeText={set('age')} keyboardType="numeric" />
        <Field style={{ flex: 1 }} label="Height (cm)" value={p.heightCm} onChangeText={set('heightCm')} keyboardType="numeric" />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field style={{ flex: 1 }} label="Current weight (kg)" value={p.weightKg} onChangeText={set('weightKg')} keyboardType="numeric" />
        <Field style={{ flex: 1 }} label="Goal weight (kg)" value={p.goalWeight} onChangeText={set('goalWeight')} keyboardType="numeric" />
      </View>
      <Text style={{ color: C.sub, fontSize: 12, marginBottom: 6 }}>Activity level</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {ACTIVITY.map((a) => (
          <Chip key={a.key} label={a.label} active={p.activity === a.key} onPress={() => set('activity')(a.key)} />
        ))}
      </View>
      <Text style={{ color: C.sub, fontSize: 12, marginVertical: 6 }}>How fast do you want to gain?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {RATES.map((r) => (
          <Chip key={r.key} label={r.label} active={p.rate === r.key} onPress={() => set('rate')(r.key)} />
        ))}
      </View>
      <Sub style={{ marginBottom: 12 }}>{RATES.find((r) => r.key === p.rate)?.hint}</Sub>
      {preview ? (
        <Text style={{ color: C.accent, fontWeight: '700', marginBottom: 12 }}>Starting target: ~{preview} kcal/day</Text>
      ) : null}
      <Btn title={saveLabel} onPress={save} />
    </View>
  );
}
