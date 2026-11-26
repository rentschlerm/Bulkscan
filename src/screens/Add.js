import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useStore, newId } from '../store';
import { Card, H, Sub, Btn, Chip, Field, s as ui } from '../components/ui';
import { C, MEALS, guessMeal } from '../theme';
import { analyzeMeal, prepareImage } from '../ai';
import { lookupBarcode, searchProducts } from '../openfoodfacts';
import { searchLocal } from '../foods';
import { macrosFromPer100, sumEntries } from '../nutrition';
import RecipeMode from './Recipe';

const CONF_COLOR = { high: C.accent, medium: C.carbs, low: C.danger };

function itemFromFood(f, grams) {
  return {
    key: newId(),
    name: f.name,
    grams: Math.round(grams ?? f.serving ?? 100),
    per100: f.per100,
    confidence: 'high',
    note: f.servingLabel ? `1 ${f.servingLabel.replace(/^1 /, '')} ≈ ${f.serving} g` : '',
    source: f.source || (f.mine ? 'custom' : 'db'),
    serving: f.serving,
  };
}

export default function AddScreen({ date, initialMode, onDone }) {
  const store = useStore();
  const [mode, setMode] = useState(initialMode || 'menu');
  const [photos, setPhotos] = useState([]); // {uri, b64}
  const [context, setContext] = useState('');
  const [items, setItems] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [photoTip, setPhotoTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  const cancelAnalysis = () => abortRef.current?.abort();
  const [meal, setMeal] = useState(guessMeal());
  const [saveAsMine, setSaveAsMine] = useState(false);
  const [mineName, setMineName] = useState('');

  useEffect(() => {
    if (initialMode === 'camera') takePhoto(true);
    else if (initialMode) setMode(initialMode);
  }, [initialMode]);

  // ---------- photo flow ----------
  async function takePhoto(fromCamera = true) {
    try {
      let res;
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return Alert.alert('Camera permission needed');
        res = await ImagePicker.launchCameraAsync({ quality: 0.9 });
      } else {
        res = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, mediaTypes: ['images'] });
      }
      if (res.canceled || !res.assets?.length) {
        if (!photos.length) setMode('menu');
        return;
      }
      const uri = res.assets[0].uri;
      setMode('photo');
      const b64 = await prepareImage(uri);
      setPhotos((p) => [...p, { uri, b64 }].slice(0, 3));
    } catch (e) {
      Alert.alert('Could not get photo', String(e.message || e));
    }
  }

  async function runAnalysis(refine = false) {
    if (!photos.length) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const ans = refine
        ? questions.map((q, i) => ({ q, a: answers[i] })).filter((x) => x.a && x.a.trim())
        : [];
      const r = await analyzeMeal({
        images: photos.map((p) => p.b64),
        apiKey: store.apiKey,
        provider: store.settings.provider,
        model: store.settings.model,
        myFoods: store.myFoods,
        plateCm: store.settings.plateCm,
        context,
        answers: ans,
        previous: refine ? items : null,
        signal: ctrl.signal,
      });
      if (!r.items.length) {
        Alert.alert('No food found', r.photo_tip || 'Try another photo.');
      } else {
        setItems(r.items);
        setQuestions(r.questions);
        setAnswers({});
        setPhotoTip(r.photo_tip || '');
        setMode('review');
      }
    } catch (e) {
      if (e.message !== 'CANCELLED') Alert.alert('Scan failed', String(e.message || e));
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  // ---------- review helpers ----------
  const setItem = (key, patch) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const removeItem = (key) => setItems((xs) => xs.filter((x) => x.key !== key));
  const computed = items.map((it) => ({ ...it, ...macrosFromPer100(it.per100, it.grams || 0) }));
  const total = sumEntries(computed);

  function log() {
    const now = Date.now();
    const entries = computed
      .filter((it) => it.grams > 0)
      .map((it) => ({
        id: newId(),
        name: it.name,
        grams: it.grams,
        per100: it.per100,
        kcal: it.kcal,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        meal,
        source: it.source,
        weighed: !!it.weighed,
        time: now,
      }));
    if (!entries.length) return;
    store.addEntries(date, entries);

    if (saveAsMine) {
      const grams = entries.reduce((a, e) => a + e.grams, 0);
      const t = sumEntries(entries);
      store.saveMyFood({
        id: 'my-' + newId(),
        name: mineName.trim() || entries.map((e) => e.name).join(' + '),
        per100: {
          kcal: Math.round((t.kcal / grams) * 100),
          protein: Math.round((t.protein / grams) * 1000) / 10,
          carbs: Math.round((t.carbs / grams) * 1000) / 10,
          fat: Math.round((t.fat / grams) * 1000) / 10,
        },
        serving: grams,
        servingLabel: '1 serving',
        tags: ['mine'],
      });
    }
    reset();
    onDone();
  }

  function reset() {
    setPhotos([]);
    setItems([]);
    setQuestions([]);
    setAnswers({});
    setContext('');
    setPhotoTip('');
    setSaveAsMine(false);
    setMineName('');
    setMode('menu');
  }

  // ---------- screens ----------
  if (mode === 'barcode') {
    return (
      <BarcodeMode
        myFoods={store.myFoods}
        onCancel={() => setMode(items.length ? 'review' : 'menu')}
        onFood={(f) => {
          setItems((xs) => [...xs, itemFromFood(f)]);
          setMode('review');
        }}
        onUnknown={(code) => setMode({ manual: true, barcode: code })}
      />
    );
  }

  if (mode === 'search') {
    return (
      <SearchMode
        myFoods={store.myFoods}
        onCancel={() => setMode(items.length ? 'review' : 'menu')}
        onPick={(f) => {
          setItems((xs) => [...xs, itemFromFood(f)]);
          setMode('review');
        }}
      />
    );
  }

  if (mode === 'recipe') {
    return (
      <RecipeMode
        myFoods={store.myFoods}
        onCancel={() => setMode(items.length ? 'review' : 'menu')}
        onSave={(food, portion) => {
          store.saveMyFood(food);
          if (portion) {
            setItems((xs) => [...xs, { ...itemFromFood(food, portion), weighed: true }]);
            setMode('review');
          } else {
            Alert.alert('Saved', `${food.name} is in My Foods. Search it, or just photograph your plate — the AI will use your recipe's values.`);
            setMode('menu');
          }
        }}
      />
    );
  }

  if (mode === 'manual' || mode?.manual) {
    return (
      <ManualMode
        barcode={mode?.barcode}
        onCancel={() => setMode(items.length ? 'review' : 'menu')}
        onAdd={(food, grams, remember) => {
          if (remember) store.saveMyFood(food);
          setItems((xs) => [...xs, itemFromFood(food, grams)]);
          setMode('review');
        }}
      />
    );
  }

  if (mode === 'photo') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
        <H>Meal photo</H>
        <ScrollView horizontal style={{ marginBottom: 12 }}>
          {photos.map((p, i) => (
            <Image key={i} source={{ uri: p.uri }} style={{ width: 150, height: 150, borderRadius: 12, marginRight: 8 }} />
          ))}
          {photos.length === 0 ? (
            <View style={{ width: 150, height: 150, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={C.accent} />
            </View>
          ) : null}
        </ScrollView>
        {photos.length < 3 ? (
          <Btn kind="secondary" title="+ Add another angle (more accurate)" onPress={() => takePhoto(true)} style={{ marginBottom: 12 }} />
        ) : null}
        <Card>
          <Text style={ui.label}>Tell the AI anything it can't see (optional, but big accuracy boost)</Text>
          <TextInput
            value={context}
            onChangeText={setContext}
            multiline
            placeholder="e.g. 2 cups rice, pork adobo with fat, fried in a lot of oil, Coke 1.5L shared"
            placeholderTextColor={C.sub}
            style={[ui.input, { minHeight: 70, textAlignVertical: 'top' }]}
          />
          <Sub style={{ marginTop: 8 }}>
            Tips: shoot from about 45°, whole plate in frame, leave a spoon or fork beside the plate for scale.
          </Sub>
        </Card>
        <Btn
          title={loading ? `Analyzing… ${elapsed}s` : 'Analyze meal'}
          disabled={!photos.length || loading}
          onPress={() => runAnalysis(false)}
        />
        {loading && elapsed >= 15 ? (
          <Sub style={{ marginTop: 6, textAlign: 'center' }}>Free tier is busy right now. It stops by itself at 60 s.</Sub>
        ) : null}
        <Btn kind="secondary" title={loading ? 'Stop' : 'Cancel'} onPress={loading ? cancelAnalysis : reset} style={{ marginTop: 8 }} />
      </ScrollView>
    );
  }

  if (mode === 'review') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <H style={{ marginBottom: 0 }}>Check & adjust</H>
          <Text style={{ color: C.accent, fontSize: 22, fontWeight: '800' }}>{total.kcal} kcal</Text>
        </View>
        <Sub style={{ marginBottom: 12 }}>
          P {Math.round(total.protein)} g · C {Math.round(total.carbs)} g · F {Math.round(total.fat)} g — fix any grams that look off. Weighed items are exact.
        </Sub>

        {photoTip ? (
          <Card style={{ borderColor: C.carbs }}>
            <Sub>📸 {photoTip}</Sub>
          </Card>
        ) : null}

        {computed.map((it) => (
          <Card key={it.key}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={it.name}
                onChangeText={(v) => setItem(it.key, { name: v })}
                style={{ color: C.text, fontSize: 16, fontWeight: '700', flex: 1, padding: 0 }}
              />
              <TouchableOpacity onPress={() => removeItem(it.key)} style={{ padding: 4 }}>
                <Text style={{ color: C.sub, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              {it.source === 'ai' ? (
                <Text style={{ color: CONF_COLOR[it.confidence] || C.sub, fontSize: 12, marginRight: 8 }}>
                  ● {it.confidence} confidence
                </Text>
              ) : null}
              {it.low && it.high ? (
                <Text style={{ color: C.sub, fontSize: 12 }}>
                  likely {it.low}–{it.high} g
                </Text>
              ) : null}
            </View>
            {it.note ? <Sub style={{ marginTop: 2 }}>{it.note}</Sub> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <Btn small kind="secondary" title="−25" onPress={() => setItem(it.key, { grams: Math.max(0, it.grams - 25), weighed: false })} />
              <TextInput
                value={String(it.grams)}
                keyboardType="numeric"
                onChangeText={(v) => setItem(it.key, { grams: Number(v.replace(/[^0-9]/g, '')) || 0 })}
                style={[ui.input, { width: 80, marginHorizontal: 8, textAlign: 'center' }]}
              />
              <Text style={{ color: C.sub, marginRight: 8 }}>g</Text>
              <Btn small kind="secondary" title="+25" onPress={() => setItem(it.key, { grams: it.grams + 25, weighed: false })} />
              <View style={{ flex: 1 }} />
              <Text style={{ color: C.text, fontWeight: '800', fontSize: 16 }}>{it.kcal}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
              <Chip
                label={it.weighed ? '⚖️ Weighed (exact)' : '⚖️ I weighed this'}
                active={!!it.weighed}
                onPress={() => setItem(it.key, { weighed: !it.weighed })}
              />
              {it.serving && it.source !== 'ai'
                ? [0.5, 1, 1.5, 2].map((m) => (
                    <Chip key={m} label={`${m}×`} active={it.grams === Math.round(it.serving * m)} onPress={() => setItem(it.key, { grams: Math.round(it.serving * m) })} />
                  ))
                : null}
            </View>
          </Card>
        ))}

        {questions.length ? (
          <Card style={{ borderColor: C.protein }}>
            <H>Answer to sharpen the estimate</H>
            {questions.map((q, i) => (
              <Field key={i} label={q} value={answers[i] || ''} onChangeText={(v) => setAnswers((a) => ({ ...a, [i]: v }))} />
            ))}
            <Btn
              kind="secondary"
              title={loading ? `Re-analyzing… ${elapsed}s` : 'Re-analyze with answers'}
              disabled={loading || !Object.values(answers).some((a) => a && a.trim())}
              onPress={() => runAnalysis(true)}
            />
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <Btn small style={{ flex: 1 }} kind="secondary" title="+ Search food" onPress={() => setMode('search')} />
          <Btn small style={{ flex: 1 }} kind="secondary" title="+ Barcode" onPress={() => setMode('barcode')} />
          <Btn small style={{ flex: 1 }} kind="secondary" title="+ Manual" onPress={() => setMode('manual')} />
        </View>

        <Card>
          <Text style={ui.label}>Meal</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {MEALS.map((m) => (
              <Chip key={m} label={m} active={meal === m} onPress={() => setMeal(m)} />
            ))}
          </View>
          <Chip
            label={saveAsMine ? '★ Will save to My Foods' : '☆ Save this meal to My Foods (for next time)'}
            active={saveAsMine}
            onPress={() => setSaveAsMine(!saveAsMine)}
          />
          {saveAsMine ? <Field placeholder="Name, e.g. Mama's adobo plate" value={mineName} onChangeText={setMineName} /> : null}
        </Card>

        <Btn title={`Log ${total.kcal} kcal`} onPress={log} disabled={!items.length} />
        <Btn kind="secondary" title="Discard" onPress={reset} style={{ marginTop: 8, marginBottom: 24 }} />
      </ScrollView>
    );
  }

  // menu
  const noKey = !store.apiKey;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <H style={{ fontSize: 24 }}>Add food</H>
      {noKey ? (
        <Card style={{ borderColor: C.carbs }}>
          <Sub>Photo scanning needs a free Google Gemini key (Settings → AI scanning). Recipes, search, barcode and manual entry work without it.</Sub>
        </Card>
      ) : null}
      <MenuItem icon="📷" title="Scan my plate" desc="Take a photo — AI lists each item with grams & calories" onPress={() => takePhoto(true)} disabled={noKey} />
      <MenuItem icon="🖼" title="From gallery" desc="Use a photo you already took" onPress={() => takePhoto(false)} disabled={noKey} />
      <MenuItem icon="🍳" title="Recipe builder (most accurate)" desc="Weigh what you cook once → exact kcal per 100 g, reused forever" onPress={() => setMode('recipe')} />
      <MenuItem icon="▦" title="Scan barcode" desc="Packaged food only (Milo, canned goods, noodles, bread)" onPress={() => setMode('barcode')} />
      <MenuItem icon="🔎" title="Search foods" desc="Filipino dishes, your saved meals, and packaged products" onPress={() => setMode('search')} />
      <MenuItem icon="✏️" title="Manual entry" desc="Type calories from a label or menu" onPress={() => setMode('manual')} />
    </ScrollView>
  );
}

function MenuItem({ icon, title, desc, onPress, disabled }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.4 : 1 }}>
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 28, marginRight: 14 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
          <Sub>{desc}</Sub>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function BarcodeMode({ myFoods, onCancel, onFood, onUnknown }) {
  const [perm, requestPerm] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);

  if (!perm) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  if (!perm.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16, justifyContent: 'center' }}>
        <Sub style={{ marginBottom: 12 }}>Camera access is needed to scan barcodes.</Sub>
        <Btn title="Allow camera" onPress={requestPerm} />
        <Btn kind="secondary" title="Back" onPress={onCancel} style={{ marginTop: 8 }} />
      </View>
    );
  }

  const onScan = async ({ data }) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      const mine = myFoods.find((f) => f.barcode === data);
      if (mine) return onFood(mine);
      const f = await lookupBarcode(data);
      if (f) return onFood(f);
      Alert.alert('Not in the database', 'Enter the values from the label once — it will be remembered for next time.', [
        { text: 'Cancel', onPress: () => { locked.current = false; setBusy(false); } },
        { text: 'Enter label', onPress: () => onUnknown(data) },
      ]);
    } catch (e) {
      Alert.alert('Lookup failed', 'Check your internet connection.');
      locked.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={busy ? undefined : onScan}
      />
      <View style={{ position: 'absolute', top: '40%', left: '10%', right: '10%', height: 120, borderWidth: 2, borderColor: C.accent, borderRadius: 12 }} />
      <View style={{ padding: 16, backgroundColor: C.bg }}>
        {busy ? <ActivityIndicator color={C.accent} style={{ marginBottom: 8 }} /> : <Sub style={{ marginBottom: 8 }}>Point at the barcode.</Sub>}
        <Btn kind="secondary" title="Cancel" onPress={onCancel} />
      </View>
    </View>
  );
}

function SearchMode({ myFoods, onCancel, onPick }) {
  const [q, setQ] = useState('');
  const [online, setOnline] = useState([]);
  const [busy, setBusy] = useState(false);
  const local = useMemo(() => searchLocal(q, myFoods), [q, myFoods]);

  const goOnline = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      setOnline(await searchProducts(q));
    } catch (e) {
      Alert.alert('Search failed', 'Check your internet connection.');
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ f }) => (
    <TouchableOpacity onPress={() => onPick(f)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Text style={{ color: C.text }}>
        {f.mine ? '★ ' : ''}
        {f.name}
      </Text>
      <Text style={{ color: C.sub, fontSize: 12 }}>
        {f.per100.kcal} kcal/100 g · {f.servingLabel || 'serving'} ≈ {f.serving} g = {Math.round((f.per100.kcal * f.serving) / 100)} kcal
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Field placeholder="Search: adobo, rice, pandesal, Milo…" value={q} onChangeText={(v) => { setQ(v); setOnline([]); }} />
      <Card>
        {local.length ? local.map((f) => <Row key={f.id} f={f} />) : <Sub>No match in built-in foods.</Sub>}
      </Card>
      <Btn kind="secondary" title="Search packaged products online" loading={busy} onPress={goOnline} disabled={!q.trim()} />
      {online.length ? (
        <Card style={{ marginTop: 12 }}>
          {online.map((f) => <Row key={f.id} f={f} />)}
        </Card>
      ) : null}
      <Btn kind="secondary" title="Back" onPress={onCancel} style={{ marginTop: 12, marginBottom: 24 }} />
    </ScrollView>
  );
}

function ManualMode({ barcode, onCancel, onAdd }) {
  const [v, setV] = useState({ name: '', grams: '100', kcal: '', protein: '', carbs: '', fat: '' });
  const [remember, setRemember] = useState(!!barcode);
  const set = (k) => (x) => setV((o) => ({ ...o, [k]: x }));
  const n = (x) => Number(String(x).replace(',', '.')) || 0;

  const add = () => {
    const g = n(v.grams) || 100;
    if (!v.name.trim() || !n(v.kcal)) return Alert.alert('Enter at least a name and calories');
    const f = 100 / g;
    const food = {
      id: 'my-' + newId(),
      name: v.name.trim(),
      per100: { kcal: Math.round(n(v.kcal) * f), protein: n(v.protein) * f, carbs: n(v.carbs) * f, fat: n(v.fat) * f },
      serving: g,
      servingLabel: '1 serving',
      tags: ['mine'],
      barcode: barcode || undefined,
      source: barcode ? 'barcode' : 'manual',
    };
    onAdd(food, g, remember);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H>{barcode ? 'New product' : 'Manual entry'}</H>
      {barcode ? <Sub style={{ marginBottom: 12 }}>Barcode {barcode} — copy the values from the nutrition label.</Sub> : null}
      <Field label="Name" value={v.name} onChangeText={set('name')} />
      <Field label="Amount (g or ml) these values are for" value={v.grams} onChangeText={set('grams')} keyboardType="numeric" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field style={{ flex: 1 }} label="Calories" value={v.kcal} onChangeText={set('kcal')} keyboardType="numeric" />
        <Field style={{ flex: 1 }} label="Protein g" value={v.protein} onChangeText={set('protein')} keyboardType="numeric" />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field style={{ flex: 1 }} label="Carbs g" value={v.carbs} onChangeText={set('carbs')} keyboardType="numeric" />
        <Field style={{ flex: 1 }} label="Fat g" value={v.fat} onChangeText={set('fat')} keyboardType="numeric" />
      </View>
      <Chip label={remember ? '★ Remember in My Foods' : '☆ Remember in My Foods'} active={remember} onPress={() => setRemember(!remember)} />
      <Btn title="Add" onPress={add} style={{ marginTop: 8 }} />
      <Btn kind="secondary" title="Back" onPress={onCancel} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}
