import React, { useState } from 'react';
import { ScrollView, View, Text, Switch, Alert, Share, TextInput, TouchableOpacity } from 'react-native';
import { useStore, DEFAULT_SETTINGS } from '../store';
import { Card, H, Sub, Btn, Field, s as ui } from '../components/ui';
import ProfileForm from '../components/ProfileForm';
import { C } from '../theme';
import { PROVIDERS, DEFAULT_PROVIDER } from '../ai';
import { Chip } from '../components/ui';
import { KScroll, Input } from '../components/keyboard';

const REMINDER_LABELS = {
  weighIn: 'Morning weigh-in',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  merienda: 'Merienda',
  dinner: 'Dinner',
  nudge: 'Evening "calories left" nudge',
};

export default function SettingsScreen({ targets }) {
  const store = useStore();
  const [editing, setEditing] = useState(false);
  const [provider, setProvider] = useState(store.settings.provider || DEFAULT_PROVIDER);
  const [keyDraft, setKeyDraft] = useState(store.keys);
  const [model, setModel] = useState(store.settings.model || PROVIDERS[provider].defaultModel);
  const [plate, setPlate] = useState(String(store.settings.plateCm || 25));
  const [override, setOverride] = useState(store.settings.targetOverride ? String(store.settings.targetOverride) : '');
  const [importText, setImportText] = useState('');
  const r = store.settings.reminders;

  const setReminder = (k, patch) =>
    store.setSettings({ reminders: { ...r, [k]: { ...r[k], ...patch } } });

  return (
    <KScroll style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H style={{ fontSize: 24 }}>Settings</H>

      <Card>
        <H>Daily targets</H>
        <Text style={{ color: C.text, fontSize: 16 }}>
          {targets.kcal} kcal · P {targets.protein} g · C {targets.carbs} g · F {targets.fat} g
        </Text>
        <Sub style={{ marginTop: 4 }}>
          {targets.source === 'calibrated'
            ? `Calibrated from your real results (maintenance ${store.settings.calibratedTdee}) + ${targets.surplus} surplus.`
            : targets.source === 'manual'
            ? 'Manual target set by you.'
            : `Formula: maintenance ~${targets.tdee} + ${targets.surplus} kcal surplus for ${store.profile.rate} kg/week. Protein 1.8 g per kg body weight.`}
        </Sub>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'flex-start' }}>
          <Field style={{ flex: 1 }} placeholder="Manual kcal target (optional)" value={override} onChangeText={setOverride} keyboardType="numeric" />
          <Btn
            small
            kind="secondary"
            title={override ? 'Set' : 'Clear'}
            style={{ paddingVertical: 12 }}
            onPress={() => store.setSettings({ targetOverride: Number(override) || null })}
          />
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <H>Profile</H>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={{ color: C.accent }}>{editing ? 'Close' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        {editing ? (
          <ProfileForm
            initial={{
              ...store.profile,
              age: String(store.profile.age),
              heightCm: String(store.profile.heightCm),
              weightKg: String(store.profile.weightKg),
              goalWeight: store.profile.goalWeight ? String(store.profile.goalWeight) : '',
            }}
            onSave={(p) => {
              store.setProfile(p);
              setEditing(false);
            }}
          />
        ) : (
          <Sub>
            {store.profile.name ? store.profile.name + ' · ' : ''}
            {store.profile.age} y · {store.profile.heightCm} cm · goal {store.profile.goalWeight || '—'} kg · {store.profile.rate} kg/week
          </Sub>
        )}
      </Card>

      <Card>
        <H>AI photo scanning</H>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {Object.entries(PROVIDERS).map(([id, p]) => (
            <Chip
              key={id}
              label={p.label}
              active={provider === id}
              onPress={() => {
                setProvider(id);
                setModel(PROVIDERS[id].defaultModel);
              }}
            />
          ))}
        </View>
        <Sub style={{ marginBottom: 8 }}>
          {provider === 'gemini'
            ? 'Free: get a key at aistudio.google.com/apikey with your Google account, no card needed. The free tier has daily and per-minute limits (plenty for a few meals a day), and Google may use free-tier inputs to improve its products.'
            : 'Paid: key from console.anthropic.com. About a peso or two per scan.'}{' '}
          Keys are stored encrypted on this phone only.
        </Sub>
        <Field
          label={`${PROVIDERS[provider].label} API key`}
          value={keyDraft[provider] || ''}
          onChangeText={(v) => setKeyDraft((k) => ({ ...k, [provider]: v }))}
          secure
        />
        <Field label="Model (change only if the default stops working)" value={model} onChangeText={setModel} />
        <Field label="Your usual plate diameter (cm), used for scale" value={plate} onChangeText={setPlate} keyboardType="numeric" />
        <Btn
          title="Save AI settings"
          onPress={async () => {
            await store.setApiKey(provider, (keyDraft[provider] || '').trim());
            store.setSettings({ provider, model: model.trim() || PROVIDERS[provider].defaultModel, plateCm: Number(plate) || 25 });
            Alert.alert('Saved');
          }}
        />
      </Card>

      <Card>
        <H>Reminders</H>
        {Object.keys(REMINDER_LABELS).map((k) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ color: C.text, flex: 1 }}>{REMINDER_LABELS[k]}</Text>
            <Input
              onEndEditing={(e) => {
                const t = e.nativeEvent.text;
                if (!/^\d{1,2}:\d{2}$/.test(t)) Alert.alert('Use 24-hour time like 19:30');
                else setReminder(k, { time: t });
              }}
              defaultValue={r[k]?.time || DEFAULT_SETTINGS.reminders[k].time}
              keyboardType="numbers-and-punctuation"
              style={[ui.input, { width: 72, paddingVertical: 6, marginRight: 10, textAlign: 'center' }]}
            />
            <Switch value={!!r[k]?.on} onValueChange={(on) => setReminder(k, { on })} trackColor={{ true: C.accent }} />
          </View>
        ))}
        <Sub>24-hour time. The evening nudge tells you exactly how many calories you still need.</Sub>
      </Card>

      <Card>
        <H>My Foods ({store.myFoods.length})</H>
        {store.myFoods.length === 0 ? <Sub>Meals and products you save appear here and in search.</Sub> : null}
        {store.myFoods.map((f) => (
          <TouchableOpacity
            key={f.id}
            onLongPress={() =>
              Alert.alert('Delete?', f.name, [
                { text: 'Cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => store.removeMyFood(f.id) },
              ])
            }
            style={{ paddingVertical: 6 }}
          >
            <Text style={{ color: C.text }}>{f.name}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>
              {Math.round((f.per100.kcal * f.serving) / 100)} kcal per {f.serving} g{f.barcode ? ' · ▦ ' + f.barcode : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card>
        <H>Backup</H>
        <Sub style={{ marginBottom: 8 }}>Data lives on this phone. Export now and then (send it to yourself on Messenger or email).</Sub>
        <Btn kind="secondary" title="Export backup" onPress={() => Share.share({ message: store.exportJson() })} />
        <Input
          value={importText}
          onChangeText={setImportText}
          placeholder="Paste a backup here to restore"
          placeholderTextColor={C.sub}
          multiline
          style={[ui.input, { marginTop: 10, minHeight: 60 }]}
        />
        <Btn
          kind="secondary"
          title="Restore backup"
          disabled={!importText.trim()}
          style={{ marginTop: 8 }}
          onPress={() =>
            Alert.alert('Replace all data?', 'This overwrites everything on this phone.', [
              { text: 'Cancel' },
              {
                text: 'Restore',
                style: 'destructive',
                onPress: () => {
                  try {
                    store.importJson(importText.trim());
                    setImportText('');
                    Alert.alert('Restored');
                  } catch (e) {
                    Alert.alert('Restore failed', String(e.message || e));
                  }
                },
              },
            ])
          }
        />
      </Card>

      <Sub style={{ marginBottom: 24 }}>
        BulkScan gives estimates, not medical advice. If you're underweight because of a health issue or appetite loss, check with a
        doctor.
      </Sub>
    </KScroll>
  );
}
