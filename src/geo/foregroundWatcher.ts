/**
 * Follows the user's position **while the app is open** and decides by itself
 * when the user enters or leaves a zone.
 *
 * Used in Expo Go *and* in the real build:
 * - in Expo Go it is the only tracking (Expo Go cannot track in the background),
 * - in the real build it makes reminders react within seconds while the app is
 *   open; when the app is closed the system geofencing takes over.
 *
 * The zone comparison itself is in `zoneChecker.ts` (shared with the
 * background tracker). It also shares the latest position with screens (map, distances) through
 * {@link subscribeToPosition}.
 *
 * @module geo/foregroundWatcher
 * @category Location
 */
import * as Location from 'expo-location';

import { addLogEntry } from '@/data/activityLog';

import { checkZonesAt } from './zoneChecker';

/** The running position subscription, or `null` when not started. */
let subscription: Location.LocationSubscription | null = null;
/** The latest position we received. */
let lastPosition: Location.LocationObject | null = null;

/** Functions that want every new position (map, distances). */
const positionListeners = new Set<(position: Location.LocationObject) => void>();

/** Calls `listener` with every new position. Returns a function that stops it. */
export function subscribeToPosition(listener: (position: Location.LocationObject) => void): () => void {
  positionListeners.add(listener);
  if (lastPosition) listener(lastPosition);
  return () => {
    positionListeners.delete(listener);
  };
}

/** The latest known position (or `null`). */
export function getLastPosition(): Location.LocationObject | null {
  return lastPosition;
}

/**
 * Starts following the position (if not already running).
 * Returns `false` when location permission is missing.
 */
export async function startForegroundWatcher(): Promise<boolean> {
  if (subscription) return true;

  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') return false;

  subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
    (position) => {
      lastPosition = position;
      positionListeners.forEach((listener) => listener(position));
      // Also the first position after opening the app is checked normally: if you are
      // inside a zone the phone never reported (it was asleep), the reminder comes now.
      void checkZonesAt(position, 'watcher');
    },
  );
  void addLogEntry('info', 'Following your position while the app is open.');
  return true;
}

/** Stops following the position (called when the app goes to the background). */
export function stopForegroundWatcher(): void {
  subscription?.remove();
  subscription = null;
}

/** Checks the last known position again right away (after zones changed). */
export function checkPositionNow(): void {
  if (lastPosition) void checkZonesAt(lastPosition, 'watcher');
}

/** True while the app is open and following the GPS (the background tracker then rests). */
export function isWatcherRunning(): boolean {
  return subscription !== null;
}
