import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from './src/store';
import { C } from './src/theme';
import { computeTargets, sumEntries, todayKey } from './src/nutrition';
import { scheduleAll } from './src/reminders';
import TodayScreen from './src/screens/Today';
import AddScreen from './src/screens/Add';
import ProgressScreen from './src/screens/Progress';
import SettingsScreen from './src/screens/Settings';
import SetupScreen from './src/screens/Setup';

const TABS = [
  { key: 'today', label: 'Today', icon: '◎' },
  { key: 'add', label: 'Scan / Add', icon: '＋' },
  { key: 'progress', label: 'Progress', icon: '📈' },
  { key: 'settings', label: 'Settings', icon: '⚙' },
];

function Shell() {
  const store = useStore();
  const [tab, setTab] = useState('today');
  const [addMode, setAddMode] = useState(null); // lets Today open a specific add mode
  const [date, setDate] = useState(todayKey());

  const targets = useMemo(
    () => (store.profile ? computeTargets(store.profile, store.weights, store.settings) : null),
    [store.profile, store.weights, store.settings]
  );
  const todayKcal = sumEntries(store.logs[todayKey()]).kcal;

  // Keep reminders (incl. the personalised evening nudge) in sync.
  useEffect(() => {
    if (!targets) return;
    const t = setTimeout(() => scheduleAll(store.settings.reminders, targets.kcal - todayKcal), 1500);
    return () => clearTimeout(t);
  }, [targets?.kcal, todayKcal, store.settings.reminders]);

  if (!store.ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }
  if (!store.profile) return <SetupScreen />;

  const openAdd = (mode) => {
    setAddMode(mode || null);
    setTab('add');
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === 'today' && <TodayScreen date={date} setDate={setDate} targets={targets} openAdd={openAdd} />}
        {tab === 'add' && (
          <AddScreen
            date={date}
            initialMode={addMode}
            onDone={() => {
              setAddMode(null);
              setTab('today');
            }}
          />
        )}
        {tab === 'progress' && <ProgressScreen targets={targets} />}
        {tab === 'settings' && <SettingsScreen targets={targets} />}
      </View>
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card }}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => {
              if (t.key === 'add') setAddMode(null);
              setTab(t.key);
            }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}
          >
            <Text style={{ fontSize: 18, color: tab === t.key ? C.accent : C.sub }}>{t.icon}</Text>
            <Text style={{ fontSize: 11, color: tab === t.key ? C.accent : C.sub, marginTop: 2 }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
          <StatusBar style="light" />
          <Shell />
        </SafeAreaView>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
