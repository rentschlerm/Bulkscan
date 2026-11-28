// Recipe builder: weigh raw ingredients + the finished dish → exact kcal per 100 g cooked.
// Then weigh your portion (or just photograph it — the AI uses these values).
import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Card, H, Sub, Btn, Chip, Field, s as ui } from '../components/ui';
import { C } from '../theme';
import { searchRaw, searchLocal } from '../foods';
import { macrosFromPer100, sumEntries } from '../nutrition';
import { newId } from '../store';
import { KScroll, Input } from '../components/keyboard';

export default function RecipeMode({ myFoods, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState([]); // {key, food, grams}
  const [q, setQ] = useState('');
  const [pot, setPot] = useState('');
  const [full, setFull] = useState('');
  const [portion, setPortion] = useState('');

  const results = useMemo(() => {
    const raw = searchRaw(q);
    const other = q.trim() ? searchLocal(q, myFoods).filter((f) => !raw.some((r) => r.id === f.id)) : [];
    return [...raw, ...other].slice(0, q.trim() ? 15 : 8);
  }, [q, myFoods]);

  const totals = sumEntries(rows.map((r) => macrosFromPer100(r.food.per100, r.grams || 0)));
  const rawWeight = rows.reduce((a, r) => a + (r.grams || 0), 0);
  const cooked = Number(full) > 0 ? Number(full) - (Number(pot) || 0) : 0;
  const base = cooked > 0 ? cooked : rawWeight;
  const per100 = base
    ? {
        kcal: Math.round((totals.kcal / base) * 100),
        protein: Math.round((totals.protein / base) * 1000) / 10,
        carbs: Math.round((totals.carbs / base) * 1000) / 10,
        fat: Math.round((totals.fat / base) * 1000) / 10,
      }
    : null;
  const portionKcal = per100 && Number(portion) ? Math.round((per100.kcal * Number(portion)) / 100) : null;

  const add = (food) => {
    setRows((r) => [...r, { key: newId(), food, grams: food.serving || 100 }]);
    setQ('');
  };
  const setGrams = (key, g) => setRows((r) => r.map((x) => (x.key === key ? { ...x, grams: g } : x)));

  const save = (logPortion) => {
    if (!name.trim()) return Alert.alert('Give the dish a name', 'e.g. "Adobong manok (my recipe)"');
    if (!rows.length) return Alert.alert('Add the ingredients first');
    if (cooked <= 0) {
      return Alert.alert(
        'No cooked weight',
        'Without weighing the finished dish, values are based on raw weight and will be off (water cooks off, sauce reduces). Save anyway?',
        [{ text: 'Cancel' }, { text: 'Save anyway', onPress: () => finish(logPortion) }]
      );
    }
    finish(logPortion);
  };

  const finish = (logPortion) => {
    const food = {
      id: 'my-' + newId(),
      name: name.trim(),
      per100,
      serving: Number(portion) || 250,
      servingLabel: '1 serving',
      tags: ['mine', 'recipe'],
      recipe: { ingredients: rows.map((r) => ({ name: r.food.name, grams: r.grams })), cookedGrams: cooked || null },
      source: 'custom',
    };
    onSave(food, logPortion ? Number(portion) || null : null);
  };

  return (
    <KScroll style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H style={{ fontSize: 22 }}>Recipe builder</H>
      <Sub style={{ marginBottom: 12 }}>
        The most accurate way to count home cooking. Weigh each ingredient raw, weigh the finished dish, and you get exact calories
        per 100 g. Then weigh your plate, or photograph it later — the AI will use these values.
      </Sub>

      <Field label="Dish name" value={name} onChangeText={setName} placeholder="Adobong manok (my recipe)" />

      <Card>
        <H>1 · Ingredients (raw weight)</H>
        {rows.map((r) => {
          const m = macrosFromPer100(r.food.per100, r.grams || 0);
          return (
            <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.text, flex: 1 }} numberOfLines={2}>{r.food.name}</Text>
              <Input
                value={String(r.grams)}
                keyboardType="numeric"
                onChangeText={(v) => setGrams(r.key, Number(v.replace(/[^0-9]/g, '')) || 0)}
                style={[ui.input, { width: 70, paddingVertical: 6, textAlign: 'center', marginHorizontal: 6 }]}
              />
              <Text style={{ color: C.sub, width: 64, textAlign: 'right' }}>{m.kcal} kcal</Text>
              <TouchableOpacity onPress={() => setRows((x) => x.filter((y) => y.key !== r.key))} style={{ paddingLeft: 8 }}>
                <Text style={{ color: C.sub }}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <Field style={{ marginTop: 10 }} placeholder="Add ingredient: chicken, toyo, mantika…" value={q} onChangeText={setQ} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {results.map((f) => (
            <Chip key={f.id} label={`${f.name} · ${f.per100.kcal}/100g`} onPress={() => add(f)} />
          ))}
        </View>
        <Sub>Don't forget the oil — 1 tbsp is about 120 kcal. Soup water adds weight, not calories.</Sub>
      </Card>

      <Card>
        <H>2 · Weigh the finished dish</H>
        <Sub style={{ marginBottom: 8 }}>Weigh the empty pot once, then the pot with the cooked food.</Sub>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Field style={{ flex: 1 }} label="Empty pot (g)" value={pot} onChangeText={setPot} keyboardType="numeric" />
          <Field style={{ flex: 1 }} label="Pot + food (g)" value={full} onChangeText={setFull} keyboardType="numeric" />
        </View>
        <Sub>
          Raw total {rawWeight} g{cooked > 0 ? ` → cooked ${cooked} g` : ''} · whole pot {totals.kcal} kcal
        </Sub>
      </Card>

      {per100 ? (
        <Card style={{ borderColor: C.accent }}>
          <H>{per100.kcal} kcal per 100 g</H>
          <Sub>
            P {per100.protein} g · C {per100.carbs} g · F {per100.fat} g per 100 g
          </Sub>
          <Field style={{ marginTop: 10 }} label="3 · Your portion (g), optional" value={portion} onChangeText={setPortion} keyboardType="numeric" />
          {portionKcal != null ? <Text style={{ color: C.accent, fontWeight: '700', marginBottom: 8 }}>Your plate: {portionKcal} kcal</Text> : null}
          <Btn title="Save to My Foods" onPress={() => save(false)} />
          {Number(portion) > 0 ? <Btn title="Save & log my portion" onPress={() => save(true)} style={{ marginTop: 8 }} /> : null}
        </Card>
      ) : null}

      <Btn kind="secondary" title="Back" onPress={onCancel} style={{ marginBottom: 24 }} />
    </KScroll>
  );
}
