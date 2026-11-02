/**
 * **Is GeoNote still able to remind me?** — the app watches itself.
 *
 * How it works (all plain functions):
 *
 * 1. **Check** ({@link runHealthCheck}) — permissions, location on/off, is the
 *    phone still watching the zones (restarts it if not), battery optimization,
 *    power saver. Runs when the app opens, from the periodic background check
 *    (`healthTask.ts`, about every hour) and after zone events.
 * 2. **Sign of life** — every check saves "alive at …" and moves the
 *    **watchdog** notification {@link HEALTH_CONFIG.watchdogHours} hours ahead.
 *    If the phone puts the app to sleep, nobody moves it and the phone itself
 *    shows "GeoNote may be asleep" — the only message that works even when the
 *    app cannot run at all.
 * 3. **Sleep gap** ({@link onAppOpened}) — opening the app after a long silence
 *    shows "GeoNote was asleep from … to …".
 * 4. **Caught late** ({@link recordLateCatch}) — the GPS found you inside a zone
 *    right after opening the app, but the system never reported the arrival:
 *    proof that background reminders were blocked.
 *
 * New serious problems found in the background are announced with a quiet
 * notification (at most once per day per problem). Everything is also written
 * to the activity log.
 *
 * @module features/health/healthCheck
 * @category Feature: Health
 */
import * as BackgroundTask from 'expo-background-task';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addLogEntry } from '@/data/activityLog';
import { getSettings } from '@/data/settings';
import { getAllZones } from '@/data/zones';
import { GEOFENCE_TASK } from '@/geo/constants';
import { refreshGeofences } from '@/geo/geofenceManager';
import { formatDateTime, getDictionary } from '@/i18n/dictionaries';
import { cancelScheduledNotification, showStatusNotification } from '@/notifications/notifications';
import { IS_EXPO_GO } from '@/utils/runtime';

import { HEALTH_CONFIG } from './healthConfig';
import { readHealthState, updateHealthState, type AliveSource, type HealthProblem, type HealthReport, type SleepGap } from './healthState';

/** Id of the scheduled "GeoNote may be asleep" notification. */
const WATCHDOG_ID = 'health-watchdog';
/** Id of the "reminders may not pop up" notification. */
const PROBLEM_NOTICE_ID = 'health-problem';

const HOUR_MS = 60 * 60 * 1000;

/** When the app was last opened (in memory; used by {@link wasJustOpened}). */
let openedAt = 0;

// ---- 1. Check -------------------------------------------------------------------

/** Looks at everything reminders depend on and returns the problems found. */
async function findProblems(activeZones: number): Promise<HealthProblem[]> {
  const problems: HealthProblem[] = [];

  if (!(await safe(() => Location.hasServicesEnabledAsync(), true))) problems.push({ id: 'location-off', severity: 'error' });
  const foreground = await safe(() => Location.getForegroundPermissionsAsync(), null);
  if (foreground?.status !== 'granted') problems.push({ id: 'no-location', severity: 'error' });
  const notifications = await safe(() => Notifications.getPermissionsAsync(), null);
  if (notifications?.status !== 'granted') problems.push({ id: 'no-notifications', severity: 'error' });

  // Expo Go cannot work in the background at all, so the rest does not apply.
  if (IS_EXPO_GO) return problems;

  const background = await safe(() => Location.getBackgroundPermissionsAsync(), null);
  if (background?.status !== 'granted') {
    problems.push({ id: 'no-background', severity: 'error' });
  } else if (activeZones > 0) {
    // The phone should be watching the zones. If it stopped, try to start it again.
    let watching = await safe(() => Location.hasStartedGeofencingAsync(GEOFENCE_TASK), true);
    if (!watching) {
      void addLogEntry('info', 'Health check: zone watching had stopped — starting it again.');
      await safe(() => refreshGeofences({ fromBackground: true }), null);
      watching = await safe(() => Location.hasStartedGeofencingAsync(GEOFENCE_TASK), true);
    }
    if (!watching) problems.push({ id: 'tracking-stopped', severity: 'error' });
  }

  const taskStatus = await safe(() => BackgroundTask.getStatusAsync(), null);
  if (taskStatus === BackgroundTask.BackgroundTaskStatus.Restricted) problems.push({ id: 'background-restricted', severity: 'warning' });

  if (Platform.OS === 'android' && (await safe(() => Battery.isBatteryOptimizationEnabledAsync(), false))) {
    problems.push({ id: 'battery-optimized', severity: 'warning' });
  }
  if (await safe(() => Battery.isLowPowerModeEnabledAsync(), false)) problems.push({ id: 'power-saver', severity: 'warning' });

  return problems;
}

/**
 * Runs the full check, saves it as a sign of life, moves the watchdog and
 * (from the background) announces new serious problems.
 */
export async function runHealthCheck(source: AliveSource): Promise<HealthReport> {
  const zones = await safe(() => getAllZones(), []);
  const activeZones = zones.filter((zone) => zone.active).length;
  const problems = activeZones > 0 ? await findProblems(activeZones) : [];
  const now = new Date().toISOString();

  // Problems remembered from earlier (sleep gap, late catches) stay visible until the user saw them.
  const previous = await readHealthState();
  if (previous.lastGap && activeZones > 0) problems.push({ id: 'was-asleep', severity: 'warning' });
  if (previous.lateCatches.length > 0 && activeZones > 0) problems.push({ id: 'caught-late', severity: 'warning' });

  const report: HealthReport = { checkedAt: now, source, activeZones, problems };
  await updateHealthState((state) => ({
    ...state,
    report,
    lastAliveAt: now,
    lastAliveSource: source,
    lastBackgroundCheckAt: source === 'background-check' ? now : state.lastBackgroundCheckAt,
  }));

  await armWatchdog(activeZones);
  if (source !== 'app') await announceNewProblems(problems);
  return report;
}

/** A zone event from the system is also a sign of life (cheap: no full check). */
export async function markZoneEventAlive(): Promise<void> {
  const now = new Date().toISOString();
  await updateHealthState((state) => ({ ...state, lastAliveAt: now, lastAliveSource: 'zone-event' }));
  const zones = await safe(() => getAllZones(), []);
  await armWatchdog(zones.filter((zone) => zone.active).length);
}

// ---- 2. Watchdog ------------------------------------------------------------------

/** Moves the "GeoNote may be asleep" notification forward (or removes it when nothing is watched). */
async function armWatchdog(activeZones: number): Promise<void> {
  await cancelScheduledNotification(WATCHDOG_ID);
  if (IS_EXPO_GO || activeZones === 0) return;

  const { language } = await getSettings();
  const t = getDictionary(language).health;
  const at = new Date(Date.now() + HEALTH_CONFIG.watchdogHours * HOUR_MS);
  await safe(() => showStatusNotification(WATCHDOG_ID, t.watchdogTitle, t.watchdogBody(formatDateTime(new Date().toISOString(), language)), at), null);
}

// ---- 3. Announce problems ------------------------------------------------------------

/** Shows one quiet notification for serious problems not announced in the last day. */
async function announceNewProblems(problems: HealthProblem[]): Promise<void> {
  const state = await readHealthState();
  const now = Date.now();
  const fresh = problems.filter((problem) => {
    if (problem.severity !== 'error') return false;
    const last = state.notifiedAt[problem.id];
    return !last || now - Date.parse(last) > HEALTH_CONFIG.repeatProblemNoticeHours * HOUR_MS;
  });
  if (fresh.length === 0) return;

  // Without notification permission we cannot tell the user anything.
  if (fresh.some((problem) => problem.id === 'no-notifications')) return;

  const { language } = await getSettings();
  const t = getDictionary(language).health;
  await safe(() => showStatusNotification(PROBLEM_NOTICE_ID, t.problemNoticeTitle, fresh.map((problem) => t.problems[problem.id].title).join('\n')), null);
  void addLogEntry('error', `Health check: ${fresh.map((problem) => problem.id).join(', ')} — the user was notified.`);

  const nowIso = new Date(now).toISOString();
  await updateHealthState((current) => {
    const notifiedAt = { ...current.notifiedAt };
    fresh.forEach((problem) => (notifiedAt[problem.id] = nowIso));
    return { ...current, notifiedAt };
  });
}

// ---- 4. Opening the app --------------------------------------------------------------

/**
 * Call when the app opens or returns to the foreground.
 * Finds a sleep gap (before this sign of life is saved), then runs the check.
 *
 * @returns The sleep gap, if the app was asleep (show it to the user), else `null`.
 */
export async function onAppOpened(): Promise<SleepGap | null> {
  openedAt = Date.now();
  let gap: SleepGap | null = null;

  if (!IS_EXPO_GO) {
    const state = await readHealthState();
    const zones = await safe(() => getAllZones(), []);
    const lastAlive = state.lastAliveAt ? Date.parse(state.lastAliveAt) : null;
    if (lastAlive && zones.some((zone) => zone.active) && openedAt - lastAlive > HEALTH_CONFIG.sleepGapHours * HOUR_MS) {
      gap = { from: state.lastAliveAt as string, to: new Date(openedAt).toISOString() };
      await updateHealthState((current) => ({ ...current, lastGap: gap }));
      void addLogEntry('error', `GeoNote was asleep (no background activity) from ${gap.from} to ${gap.to}.`);
    }
  }

  await runHealthCheck('app');
  return gap;
}

/** True during the first moments after opening the app. */
export function wasJustOpened(): boolean {
  return Date.now() - openedAt < HEALTH_CONFIG.lateCatchWindowMs;
}

/**
 * The GPS found the user inside a zone right after the app opened, and the
 * system had not reported it: the background reminder was missed.
 */
export async function recordLateCatch(zoneName: string): Promise<void> {
  if (IS_EXPO_GO) return;
  void addLogEntry('error', `${zoneName}: the system did not report this arrival — caught only after opening the app.`);
  await updateHealthState((state) => ({
    ...state,
    lateCatches: [{ zoneName, at: new Date().toISOString() }, ...state.lateCatches].slice(0, HEALTH_CONFIG.maxLateCatches),
  }));
}

/** "I've seen it": clears the sleep gap and late catches (they stop showing as problems). */
export async function dismissHealthHistory(): Promise<void> {
  await updateHealthState((state) => ({ ...state, lastGap: null, lateCatches: [] }));
  await runHealthCheck('app');
}

// ---- Helpers ---------------------------------------------------------------------------

/** Runs `action`; on any error returns `fallback` (a failed check must never crash the app). */
async function safe<T>(action: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await action();
  } catch {
    return fallback;
  }
}
