/**
 * **Root layout** — the first code that runs when the app opens.
 *
 * It:
 * 1. defines the background geofence task (first import, must stay first),
 * 2. keeps the splash screen until data is loaded,
 * 3. loads data and starts location tracking,
 * 4. reloads when the app returns to the foreground, and stops the GPS
 *    watcher when it goes to the background (system geofencing takes over),
 * 5. shows the full-screen alarm when an alarm zone fires while the app is open,
 * 6. opens the zone when its notification is tapped, or silences an alarm on "Stop",
 * 7. shows the in-app banner (`components/InAppBanner`) for zone reminders,
 * 8. runs the app health check (`features/health`) and warns if the app was asleep,
 * 9. sets up the navigation stack and colors.
 *
 * Nothing here makes a sound on start: reminders only fire on real
 * arrivals/departures (see `geo/reminderEngine.ts`).
 *
 * @module app/_layout
 * @category Screens
 */

// ⚠️ MUST be the first import: defines the background geofence task.
import '@/geo/geofenceTask';
// Second: defines the periodic "is everything still working?" background check.
import { registerHealthTask } from '@/features/health/healthTask';

import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert, AppState, View } from 'react-native';

import { InAppBanner } from '@/components/InAppBanner';
import { stopForegroundWatcher } from '@/geo/foregroundWatcher';
import { stopAlarmSound } from '@/features/alarm/alarmSound';
import { onAppOpened } from '@/features/health/healthCheck';
import type { SleepGap } from '@/features/health/healthState';
import { formatDateTime, getDictionary } from '@/i18n/dictionaries';
import {
  configureNotificationHandler,
  dismissNotification,
  ensureNotificationChannel,
  getAlertStyle,
  STOP_ALARM_ACTION_ID,
} from '@/notifications/notifications';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme';

// Keep the splash screen until the first data load is done.
void SplashScreen.preventAutoHideAsync();

// How notifications behave while the app is open.
configureNotificationHandler();

/** Runs one startup step and only logs if it fails, so one broken step never blocks the others. */
async function runStep(name: string, step: () => Promise<unknown>) {
  try {
    await step();
  } catch (error) {
    console.warn(`[startup] ${name} failed`, error);
  }
}

/** Checks the app's health; if it was asleep, explains it once (with a shortcut to fix it). */
async function checkHealthOnOpen() {
  const gap: SleepGap | null = await onAppOpened();
  if (!gap) return;
  const { language } = useAppStore.getState().settings;
  const t = getDictionary(language).health;
  Alert.alert(t.asleepTitle, t.asleepText(formatDateTime(gap.from, language), formatDateTime(gap.to, language)), [
    { text: t.later, style: 'cancel' },
    { text: t.howToFix, onPress: () => router.push('/permissions') },
  ]);
}

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const reload = useAppStore((state) => state.reload);
  const syncGeofences = useAppStore((state) => state.syncGeofences);

  // ---- Start, foreground and background ------------------------------------
  useEffect(() => {
    async function start() {
      await runStep('load data', reload);
      await SplashScreen.hideAsync();
      await runStep('notification channels', ensureNotificationChannel);
      await runStep('location tracking', syncGeofences);
      await runStep('health task', registerHealthTask);
      await runStep('health check', checkHealthOnOpen);
    }
    void start();

    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') {
        // The background task may have changed data while the app was closed.
        void (async () => {
          await runStep('load data', reload);
          await runStep('location tracking', syncGeofences);
          await runStep('health check', checkHealthOnOpen);
        })();
      } else if (appState === 'background') {
        // Save battery: the system geofencing (real build) watches in the background.
        stopForegroundWatcher();
      }
    });
    return () => subscription.remove();
  }, [reload, syncGeofences]);

  // ---- An alarm fires while the app is open → full-screen alarm ----------------
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      if (getAlertStyle(notification) !== 'alarm') return;
      const { zoneId, trigger } = notification.request.content.data ?? {};
      const alarmId = typeof zoneId === 'string' ? zoneId : 'test';
      const event = trigger === 'exit' ? 'exit' : 'enter';
      void reload().then(() => router.push({ pathname: '/alarm/[id]', params: { id: alarmId, event } }));
    });
    return () => subscription.remove();
  }, [reload]);

  // ---- The user tapped a notification or its "Stop" button ----------------------
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastNotificationResponse) return;
    const { notification, actionIdentifier } = lastNotificationResponse;

    // "Stop" on an alarm: silence it and remove it.
    if (actionIdentifier === STOP_ALARM_ACTION_ID) {
      stopAlarmSound();
      void dismissNotification(notification.request.identifier);
      return;
    }

    // Tap on the notification: open that zone.
    if (actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    stopAlarmSound();
    void dismissNotification(notification.request.identifier);
    // App-status message ("GeoNote may be asleep") → Location & notifications.
    if (notification.request.content.data?.type === 'health') {
      router.push('/permissions');
      return;
    }
    const zoneId = notification.request.content.data?.zoneId;
    if (typeof zoneId === 'string') {
      void reload().then(() => router.push({ pathname: '/zones/[id]', params: { id: zoneId } }));
    }
  }, [lastNotificationResponse, reload]);

  // ---- Navigation colors -----------------------------------------------------
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '600' },
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
          <Stack.Screen name="edit-zone/[id]" />
          <Stack.Screen name="permissions" />
          <Stack.Screen name="navigation" options={{ headerShown: true }} />
          <Stack.Screen name="story/[placeId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen
            name="alarm/[id]"
            options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
          />
        </Stack>
        <InAppBanner />
      </View>
    </ThemeProvider>
  );
}
