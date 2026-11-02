/**
 * Follows the user's position **while the app is open** and decides by itself
 * when the user enters or leaves a zone.
 *
 * Used in Expo Go *and* in the real build:
 * - in Expo Go it is the only tracking (Expo Go cannot track in the background),
 * - in the real build it makes reminders react within seconds while the app is
 *   open; when the app is closed the system geofencing takes over.
 *
 * It also shares the latest position with screens (map, distances) through
 * {@link subscribeToPosition}.
 *
 * @module geo/foregroundWatcher
 * @category Location
 */
import * as Location from 'expo-location';

import { addLogEntry } from '@/data/activityLog';
import { getAllZones } from '@/data/zones';
import { distanceMeters } from '@/utils/geo';

import { readInside, writeInside } from './geoState';
import { handleGeofenceEvent } from './reminderEngine';

/**
 * Extra distance outside the circle before we count it as "left" (GPS jumps).
 * Half the radius, between 10 and 30 m. Example: 20 m zone → 10 m, 100 m+ → 30 m.
 */
function exitMargin(radius: number): number {
  return Math.min(30, Math.max(10, radius * 0.5));
}

/** The running position subscription, or `null` when not started. */
let subscription: Location.LocationSubscription | null = null;
/** The latest position we received. */
let lastPosition: Location.LocationObject | null = null;
/** False until the first position after start was processed. */
let firstPositionHandled = false;
/** True while a check is running, so two checks never overlap. */
let isChecking = false;

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

/** Compares the position with every active zone and reports enter/exit. */
async function checkPosition(position: Location.LocationObject): Promise<void> {
  if (isChecking) return;
  isChecking = true;
  try {
    const zones = (await getAllZones()).filter((zone) => zone.active);
    const inside = await readInside();

    for (const zone of zones) {
      const distance = distanceMeters(position.coords, zone);
      const isInsideNow = distance <= zone.radius;
      const wasInside = inside[zone.id] !== undefined;
      const isClearlyOutside = distance > zone.radius + exitMargin(zone.radius);

      if (!firstPositionHandled) {
        // First position after opening the app: just remember where the user is.
        // (Opening the app inside a zone is not an arrival — no sound on start.)
        if (isInsideNow && !wasInside) inside[zone.id] = new Date().toISOString();
        if (wasInside && isClearlyOutside) delete inside[zone.id];
        continue;
      }

      if (isInsideNow && !wasInside) await handleGeofenceEvent(zone.id, 'enter', 'watcher');
      else if (wasInside && isClearlyOutside) await handleGeofenceEvent(zone.id, 'exit', 'watcher');
    }

    if (!firstPositionHandled) {
      await writeInside(inside);
      firstPositionHandled = true;
    }
  } catch (error) {
    console.warn('[watcher] check failed', error);
  } finally {
    isChecking = false;
  }
}

/**
 * Starts following the position (if not already running).
 * Returns `false` when location permission is missing.
 */
export async function startForegroundWatcher(): Promise<boolean> {
  if (subscription) return true;

  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') return false;

  firstPositionHandled = false;
  subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
    (position) => {
      lastPosition = position;
      positionListeners.forEach((listener) => listener(position));
      void checkPosition(position);
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
  if (lastPosition && firstPositionHandled) void checkPosition(lastPosition);
}
