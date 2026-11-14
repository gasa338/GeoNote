/**
 * **Reliable mode** — Blizu watches the zones itself in the background.
 *
 * Why: the phone's own geofencing hands events to the app through Android's
 * job scheduler. When Blizu has not been opened for a while, Android moves it
 * to a "rarely used" group and holds those jobs back — reminders then come
 * late, or all at once when the app is opened.
 *
 * Fix: a small permanent notification ("Blizu is watching 3 zones") runs a
 * location service. While it runs Android treats Blizu as "in use", so it is not
 * put to sleep, and every GPS position is checked against the zones right away
 * (`zoneChecker.ts`). The phone's geofencing keeps running too, as a backup.
 *
 * Battery: the GPS mode depends on your smallest zone —
 * - all zones 100 m or larger → "balanced" location (Wi-Fi / cell, little battery),
 * - a smaller zone → precise GPS (more battery).
 *
 * ⚠️ The task is defined at the top of `src/app/_layout.tsx` (import of this file).
 *
 * @module geo/backgroundTracker
 * @category Location
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { addLogEntry } from '@/data/activityLog';
import type { Language, Zone } from '@/data/types';
import { countPositions, sampleBattery } from '@/features/battery/batteryLog';
import { markZoneEventAlive } from '@/features/health/healthCheck';
import { getDictionary } from '@/i18n/dictionaries';

import { RELIABLE_BACKGROUND_RADIUS } from './constants';
import { isWatcherRunning } from './foregroundWatcher';
import { checkZonesAt } from './zoneChecker';

/** Name of the background location task. */
export const TRACKER_TASK = 'geonote-location-task';

/** GPS settings of the tracker (see {@link trackerProfile}). */
export interface TrackerProfile {
  /** `precise` = GPS, `balanced` = Wi-Fi / cell towers. */
  accuracy: 'precise' | 'balanced';
  /** A new position only after moving this many meters. */
  distanceInterval: number;
  /** …and at most every this many ms. */
  timeInterval: number;
}

/** Picks the GPS settings for the given active zones. */
export function trackerProfile(zones: Zone[]): TrackerProfile {
  const smallest = Math.min(...zones.map((zone) => zone.radius));
  if (smallest < RELIABLE_BACKGROUND_RADIUS) return { accuracy: 'precise', distanceInterval: 15, timeInterval: 15_000 };
  return { accuracy: 'balanced', distanceInterval: 40, timeInterval: 30_000 };
}

/** Settings the tracker was last started with (to restart only when they change). */
let runningSignature: string | null = null;
/** Last time a tracker position counted as a "sign of life" for the health check. */
let lastAliveMark = 0;

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TRACKER_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  void countPositions(data.locations.length);

  // While the app is open the foreground watcher already checks every few seconds.
  if (!isWatcherRunning()) {
    const newest = data.locations[data.locations.length - 1];
    await checkZonesAt(newest, 'tracker');
  }

  // Sign of life for the health check + a battery sample, at most every 15 minutes.
  if (Date.now() - lastAliveMark > 15 * 60 * 1000) {
    lastAliveMark = Date.now();
    void markZoneEventAlive().catch(() => undefined);
    void sampleBattery();
  }
});

/** True when the tracker is running. */
export async function isTrackerRunning(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(TRACKER_TASK);
  } catch {
    return false;
  }
}

/**
 * Starts the tracker for these zones, or restarts it when the GPS settings or
 * the zone count changed. Does nothing on iOS (iOS geofencing is reliable).
 */
export async function startTracker(activeZones: Zone[], language: Language): Promise<void> {
  if (Platform.OS !== 'android' || activeZones.length === 0) return stopTracker();

  const profile = trackerProfile(activeZones);
  const signature = `${profile.accuracy}-${profile.distanceInterval}-${activeZones.length}-${language}`;
  if (runningSignature === signature && (await isTrackerRunning())) return;

  const t = getDictionary(language).tracker;
  await Location.startLocationUpdatesAsync(TRACKER_TASK, {
    accuracy: profile.accuracy === 'precise' ? Location.Accuracy.High : Location.Accuracy.Balanced,
    distanceInterval: profile.distanceInterval,
    timeInterval: profile.timeInterval,
    // Report every position at once (no batching), so reminders are not delayed.
    deferredUpdatesInterval: 0,
    deferredUpdatesDistance: 0,
    foregroundService: {
      notificationTitle: t.title,
      notificationBody: t.body(activeZones.length),
      notificationColor: '#3370EA',
      // Keep watching after the app is swiped away from recent apps.
      killServiceOnDestroy: false,
    },
  });
  runningSignature = signature;
  void addLogEntry('info', `Reliable mode on: ${activeZones.length} zone(s), ${profile.accuracy} location.`);
}

/** Stops the tracker (saver mode, no active zones, or no permission). */
export async function stopTracker(): Promise<void> {
  runningSignature = null;
  if (await isTrackerRunning()) {
    await Location.stopLocationUpdatesAsync(TRACKER_TASK);
    void addLogEntry('info', 'Reliable mode off.');
  }
}
