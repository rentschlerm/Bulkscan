import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from './ai';
import { DEFAULT_WORKOUT_SETTINGS } from './workout';

const KEY = 'bulkscan:data:v1';
const KEY_NAMES = { anthropic: 'bulkscan_api_key', gemini: 'bulkscan_key_gemini' };

export const DEFAULT_SETTINGS = {
  provider: DEFAULT_PROVIDER,
  model: DEFAULT_MODEL,
  plateCm: 25,
  calibratedTdee: null,
  targetOverride: null,
  reminders: {
    weighIn: { on: true, time: '07:00' },
    breakfast: { on: true, time: '07:30' },
    lunch: { on: true, time: '12:00' },
    merienda: { on: true, time: '15:30' },
    dinner: { on: true, time: '19:00' },
    nudge: { on: true, time: '20:30' },
  },
  workout: DEFAULT_WORKOUT_SETTINGS,
};

const EMPTY = {
  profile: null,
  settings: DEFAULT_SETTINGS,
  logs: {},
  weights: [],
  myFoods: [],
  workouts: [], // finished sessions
  routines: [], // custom workouts
  measurements: [], // {date, arm, chest, waist, thigh}
  activeSession: null,
};

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [keys, setKeys] = useState({ anthropic: '', gemini: '' });
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setData({
            ...EMPTY,
            ...parsed,
            settings: {
              ...DEFAULT_SETTINGS,
              ...(parsed.settings || {}),
              reminders: { ...DEFAULT_SETTINGS.reminders, ...(parsed.settings?.reminders || {}) },
              workout: { ...DEFAULT_WORKOUT_SETTINGS, ...(parsed.settings?.workout || {}) },
            },
          });
        }
        const loadedKeys = {};
        for (const [prov, name] of Object.entries(KEY_NAMES)) {
          loadedKeys[prov] = (await SecureStore.getItemAsync(name)) || '';
        }
        setKeys(loadedKeys);
      } catch (e) {
        console.warn('load failed', e);
      }
      loaded.current = true;
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const update = useCallback((fn) => setData((d) => ({ ...d, ...fn(d) })), []);

  const api = {
    ready,
    ...data,
    keys,
    apiKey: keys[data.settings.provider || DEFAULT_PROVIDER] || '',
    setApiKey: async (provider, k) => {
      setKeys((x) => ({ ...x, [provider]: k }));
      if (k) await SecureStore.setItemAsync(KEY_NAMES[provider], k);
      else await SecureStore.deleteItemAsync(KEY_NAMES[provider]);
    },
    setProfile: (profile) => update(() => ({ profile })),
    setSettings: (patch) => update((d) => ({ settings: { ...d.settings, ...patch } })),
    addEntries: (dateKey, entries) =>
      update((d) => ({ logs: { ...d.logs, [dateKey]: [...(d.logs[dateKey] || []), ...entries] } })),
    updateEntry: (dateKey, id, patch) =>
      update((d) => ({
        logs: { ...d.logs, [dateKey]: (d.logs[dateKey] || []).map((e) => (e.id === id ? { ...e, ...patch } : e)) },
      })),
    removeEntry: (dateKey, id) =>
      update((d) => ({ logs: { ...d.logs, [dateKey]: (d.logs[dateKey] || []).filter((e) => e.id !== id) } })),
    addWeight: (date, kg) =>
      update((d) => ({
        weights: [...d.weights.filter((w) => w.date !== date), { date, kg }].sort((a, b) =>
          a.date < b.date ? -1 : 1
        ),
      })),
    removeWeight: (date) => update((d) => ({ weights: d.weights.filter((w) => w.date !== date) })),
    saveMyFood: (food) =>
      update((d) => ({ myFoods: [food, ...d.myFoods.filter((f) => f.name.toLowerCase() !== food.name.toLowerCase())] })),
    removeMyFood: (id) => update((d) => ({ myFoods: d.myFoods.filter((f) => f.id !== id) })),
    setWorkoutSettings: (patch) =>
      update((d) => ({ settings: { ...d.settings, workout: { ...d.settings.workout, ...patch } } })),
    setActiveSession: (fnOrValue) =>
      update((d) => ({ activeSession: typeof fnOrValue === 'function' ? fnOrValue(d.activeSession) : fnOrValue })),
    finishSession: (session) =>
      update((d) => ({ workouts: [...d.workouts, session], activeSession: null })),
    removeWorkout: (id) => update((d) => ({ workouts: d.workouts.filter((w) => w.id !== id) })),
    saveRoutine: (r) => update((d) => ({ routines: [r, ...d.routines.filter((x) => x.id !== r.id)] })),
    removeRoutine: (id) => update((d) => ({ routines: d.routines.filter((x) => x.id !== id) })),
    addMeasurement: (m) =>
      update((d) => ({
        measurements: [...d.measurements.filter((x) => x.date !== m.date), m].sort((a, b) => (a.date < b.date ? -1 : 1)),
      })),
    exportJson: () => JSON.stringify(data),
    importJson: (text) => {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !parsed.logs) throw new Error('Not a BulkScan backup');
      setData({ ...EMPTY, ...parsed, settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) } });
    },
  };

  return React.createElement(Ctx.Provider, { value: api }, children);
}

export function useStore() {
  return useContext(Ctx);
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
