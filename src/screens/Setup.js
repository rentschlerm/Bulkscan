import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useStore } from '../store';
import { Card, Sub } from '../components/ui';
import ProfileForm from '../components/ProfileForm';
import { C } from '../theme';
import { todayKey } from '../nutrition';

export default function SetupScreen() {
  const store = useStore();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: C.text, fontSize: 28, fontWeight: '800', marginTop: 8 }}>BulkScan</Text>
      <Sub style={{ marginBottom: 16 }}>
        Snap your plate, hit your calories, gain weight on purpose. First, a few details so we can set your daily target.
      </Sub>
      <Card>
        <ProfileForm
          saveLabel="Start gaining"
          onSave={(p) => {
            store.setProfile(p);
            store.addWeight(todayKey(), p.weightKg);
          }}
        />
      </Card>
    </ScrollView>
  );
}
