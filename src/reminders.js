import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async (n) => {
    const kind = n?.request?.content?.data?.kind;
    // While the app is open the in-app timer already beeps/vibrates for rest.
    if (kind === 'rest') return { shouldShowAlert: false, shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false };
    return { shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false };
  },
});

const TEXT = {
  weighIn: ['Morning weigh-in ⚖️', 'Weigh yourself after the CR, before eating. Takes 10 seconds.'],
  breakfast: ['Breakfast time 🍳', "Don't skip it — breakfast is the easiest place to add calories."],
  lunch: ['Lunch 🍚', 'Snap your plate before you eat.'],
  merienda: ['Merienda 🍌', 'A snack keeps you on pace. Banana cue, pandesal + PB, or a shake.'],
  dinner: ['Dinner 🍲', 'Snap your plate. Extra rice helps if you are behind.'],
};

export async function ensurePermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync('timer', {
      name: 'Workout timer',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 400, 200, 400],
      sound: 'default',
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function hm(t) {
  const [h, m] = String(t).split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

const daily = (t) => ({
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  ...hm(t),
  channelId: 'default',
});

/**
 * Reschedules everything. The evening nudge is personalised with how many
 * calories you still need today, and is skipped if you already hit target.
 */
export async function scheduleAll(reminders, remainingKcal, workout) {
  try {
    if (!(await ensurePermission())) return;
    // Cancel everything except a running rest timer.
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of existing) {
      if (n.content?.data?.kind !== 'rest') await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
    if (workout?.setupDone && workout.remind) {
      const { hour, minute } = hm(workout.time);
      for (const d of workout.days || []) {
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Workout day 💪', body: 'Your session is waiting. Even 20 minutes counts — muscle is what makes the weight you gain look good.', data: { kind: 'workout' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: d + 1, hour, minute, channelId: 'default' },
        });
      }
    }
    for (const key of Object.keys(TEXT)) {
      const r = reminders[key];
      if (!r?.on) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: TEXT[key][0], body: TEXT[key][1] },
        trigger: daily(r.time),
      });
    }
    const n = reminders.nudge;
    if (n?.on) {
      // One-off notifications for the next 7 evenings; today's carries the live number.
      const { hour, minute } = hm(n.time);
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hour, minute);
        if (at <= now) continue;
        if (i === 0 && remainingKcal <= 150) continue; // already on target today
        const body =
          i === 0
            ? `You're ${Math.round(remainingKcal)} kcal short of today's target. A gainer shake or extra rice closes the gap.`
            : 'Open BulkScan to see if you hit today’s target — every day on target counts.';
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Evening check-in 🎯', body },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'default' },
        });
      }
    }
  } catch (e) {
    console.warn('schedule failed', e);
  }
}

// Rest-timer alert that still fires if the screen is off or you switched apps.
export async function scheduleRestEnd(seconds, nextLabel) {
  try {
    if (seconds < 3) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Rest over ⏱', body: nextLabel ? `Next: ${nextLabel}` : 'Time for your next set.', data: { kind: 'rest' }, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.round(seconds), channelId: 'timer' },
    });
  } catch (e) {
    return null;
  }
}

export async function cancelRest(id) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {}
}
