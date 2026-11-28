import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { useStore, newId } from '../store';
import { Card, H, Sub, Btn, Ring, MacroBar, Chip, Field } from '../components/ui';
import { C, MEALS, guessMeal } from '../theme';
import { sumEntries, todayKey, addDays, keyToDate, macrosFromPer100, streak } from '../nutrition';
import { BOOSTERS, foodById } from '../foods';
import { burnedOn } from '../workout';
import { KScroll, Input, KeyboardSafe } from '../components/keyboard';

function dateLabel(key) {
  const t = todayKey();
  if (key === t) return 'Today';
  if (key === addDays(t, -1)) return 'Yesterday';
  return keyToDate(key).toDateString().slice(0, 10);
}

export default function TodayScreen({ date, setDate, targets: baseTargets, openAdd }) {
  const store = useStore();
  const ws = store.settings.workout || {};
  const burned = burnedOn(store.workouts || [], date);
  const workedOut = (store.workouts || []).some((w) => w.date === date);
  const targets = ws.addBurn && burned ? { ...baseTargets, kcal: baseTargets.kcal + burned, carbs: baseTargets.carbs + Math.round(burned / 4) } : baseTargets;
  const isWorkoutDay = ws.setupDone && (ws.days || []).includes(keyToDate(date).getDay());
  const entries = store.logs[date] || [];
  const total = sumEntries(entries);
  const left = targets.kcal - total.kcal;
  const proteinLeft = targets.protein - total.protein;
  const [edit, setEdit] = useState(null);
  const [grams, setGrams] = useState('');

  const recents = useMemo(() => {
    const seen = new Map();
    const keys = Object.keys(store.logs).sort().reverse().slice(0, 14);
    for (const k of keys) {
      for (const e of [...store.logs[k]].reverse()) {
        if (!seen.has(e.name) && e.per100) seen.set(e.name, e);
        if (seen.size >= 10) break;
      }
    }
    return [...seen.values()];
  }, [store.logs]);

  const relog = (e) => {
    store.addEntries(date, [
      { ...e, id: newId(), meal: guessMeal(), time: Date.now() },
    ]);
  };

  const addBooster = (b) => {
    const f = foodById(b.id);
    if (!f) return;
    store.addEntries(date, [
      { id: newId(), name: f.name, grams: b.grams, per100: f.per100, ...macrosFromPer100(f.per100, b.grams), meal: 'Snacks', source: 'db', time: Date.now() },
    ]);
  };

  const openEdit = (e) => {
    setEdit(e);
    setGrams(String(e.grams));
  };

  const saveEdit = () => {
    const g = Number(grams);
    if (!g || !edit.per100) return setEdit(null);
    store.updateEntry(date, edit.id, { grams: g, ...macrosFromPer100(edit.per100, g) });
    setEdit(null);
  };

  const st = streak(store.logs);
  const suggestions = BOOSTERS.map((b) => {
    const f = foodById(b.id);
    return { ...b, kcal: Math.round((f.per100.kcal * b.grams) / 100) };
  })
    .filter((b) => b.kcal <= left + 150)
    .sort((a, b) => b.kcal - a.kcal)
    .slice(0, 4);

  return (
    <KScroll style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <TouchableOpacity onPress={() => setDate(addDays(date, -1))} style={{ padding: 8 }}>
          <Text style={{ color: C.text, fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>{dateLabel(date)}</Text>
          {st > 0 ? <Text style={{ color: C.carbs, fontSize: 12 }}>🔥 {st}-day logging streak</Text> : null}
        </View>
        <TouchableOpacity
          disabled={date >= todayKey()}
          onPress={() => setDate(addDays(date, 1))}
          style={{ padding: 8, opacity: date >= todayKey() ? 0.3 : 1 }}
        >
          <Text style={{ color: C.text, fontSize: 22 }}>›</Text>
        </TouchableOpacity>
      </View>

      <Card style={{ alignItems: 'center' }}>
        <Ring value={total.kcal} target={targets.kcal} />
        {workedOut ? (
          <Text style={{ color: C.protein, fontSize: 12, marginTop: 6 }}>
            🏋 Trained today · ~{burned} kcal burned{ws.addBurn ? ' (added to target)' : ''}
          </Text>
        ) : isWorkoutDay && date === todayKey() ? (
          <Text style={{ color: C.carbs, fontSize: 12, marginTop: 6 }}>🏋 Workout day — check the Workout tab</Text>
        ) : null}
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <MacroBar label="Protein" value={total.protein} target={targets.protein} color={C.protein} />
          <MacroBar label="Carbs" value={total.carbs} target={targets.carbs} color={C.carbs} />
          <MacroBar label="Fat" value={total.fat} target={targets.fat} color={C.fat} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <Btn style={{ flex: 1 }} title="📷  Scan plate" onPress={() => openAdd('camera')} />
        <Btn style={{ flex: 1 }} kind="secondary" title="🔎  My Foods / search" onPress={() => openAdd('search')} />
      </View>

      <Card>
        {left > 0 ? (
          <>
            <H>{Math.round(left)} kcal to go</H>
            <Sub>
              {proteinLeft > 5 ? `Also ${Math.round(proteinLeft)} g protein. ` : 'Protein done ✓. '}
              Quick ways to close the gap — tap to log:
            </Sub>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
              {suggestions.map((b) => (
                <Chip key={b.id} label={`${b.label} · ${b.kcal}`} onPress={() => addBooster(b)} />
              ))}
            </View>
          </>
        ) : (
          <>
            <H>Target hit 🎯</H>
            <Sub>
              {Math.round(-left)} kcal over target. A little over is fine when gaining — consistency matters more than precision.
            </Sub>
          </>
        )}
      </Card>

      {MEALS.map((meal) => {
        const list = entries.filter((e) => (e.meal || 'Snacks') === meal);
        const mk = sumEntries(list).kcal;
        return (
          <Card key={meal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <H style={{ marginBottom: 4 }}>{meal}</H>
              <Text style={{ color: C.sub }}>{mk} kcal</Text>
            </View>
            {list.length === 0 ? <Sub>Nothing logged.</Sub> : null}
            {list.map((e) => (
              <TouchableOpacity
                key={e.id}
                onPress={() => openEdit(e)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ color: C.text }}>{e.name}</Text>
                  <Text style={{ color: C.sub, fontSize: 12 }}>
                    {e.grams} g · P {Math.round(e.protein)} · C {Math.round(e.carbs)} · F {Math.round(e.fat)}
                    {e.source === 'ai' ? ' · 📷' : e.source === 'barcode' ? ' · ▦' : e.weighed ? ' · ⚖️' : ''}
                  </Text>
                </View>
                <Text style={{ color: C.text, fontWeight: '700' }}>{e.kcal}</Text>
              </TouchableOpacity>
            ))}
          </Card>
        );
      })}

      {recents.length ? (
        <Card>
          <H>Eat it again</H>
          <Sub style={{ marginBottom: 8 }}>Tap to re-log the same portion.</Sub>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {recents.map((e) => (
              <Chip key={e.name} label={`${e.name} · ${e.kcal}`} onPress={() => relog(e)} />
            ))}
          </View>
        </Card>
      ) : null}

      <Modal visible={!!edit} transparent animationType="slide" onRequestClose={() => setEdit(null)}>
        <KeyboardSafe>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: C.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            {edit ? (
              <>
                <H>{edit.name}</H>
                <Field label="Grams (weigh it for best accuracy)" value={grams} onChangeText={setGrams} keyboardType="numeric" />
                {edit.per100 && Number(grams) ? (
                  <Sub style={{ marginBottom: 12 }}>
                    = {macrosFromPer100(edit.per100, Number(grams)).kcal} kcal
                  </Sub>
                ) : null}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  {MEALS.map((m) => (
                    <Chip
                      key={m}
                      label={m}
                      active={edit.meal === m}
                      onPress={() => {
                        store.updateEntry(date, edit.id, { meal: m });
                        setEdit({ ...edit, meal: m });
                      }}
                    />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Btn
                    style={{ flex: 1 }}
                    kind="danger"
                    title="Delete"
                    onPress={() =>
                      Alert.alert('Delete entry?', edit.name, [
                        { text: 'Cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            store.removeEntry(date, edit.id);
                            setEdit(null);
                          },
                        },
                      ])
                    }
                  />
                  <Btn style={{ flex: 2 }} title="Save" onPress={saveEdit} />
                </View>
              </>
            ) : null}
          </View>
        </View>
        </KeyboardSafe>
      </Modal>
    </KScroll>
  );
}
