/**
 * Compares a position with every active zone and reports **enter / exit**
 * to `reminderEngine`. Shared by both GPS sources:
 *
 * - `foregroundWatcher.ts` — while the app is open (every few seconds),
 * - `backgroundTracker.ts` — "reliable mode" in the background.
 *
 * Positions never get lost: if a check is still running when a new position
 * arrives, the newest one is checked right after it.
 *
 * @module geo/zoneChecker
 * @category Location
 */
import type * as Location from 'expo-location';

import { getAllZones } from '@/data/zones';
import { distanceMeters } from '@/utils/geo';

import { readInside, writeInside } from './geoState';
import { handleGeofenceEvent, type EventSource } from './reminderEngine';

/**
 * Extra distance outside the circle before we count it as "left" (GPS jumps).
 * Half the radius, between 10 and 30 m. Example: 20 m zone → 10 m, 100 m+ → 30 m.
 */
function exitMargin(radius: number): number {
  return Math.min(30, Math.max(10, radius * 0.5));
}

/**
 * GPS positions worse than this (meters) are not used to decide "left the zone"
 * — a bad fix can jump hundreds of meters. Arrivals are still checked.
 */
const MAX_ACCURACY_FOR_EXIT = 150;

/** True while a check runs. */
let isChecking = false;
/** Position that arrived during a running check (only the newest is kept). */
let pending: { position: Location.LocationObject; source: EventSource } | null = null;

/**
 * Checks one position against all active zones.
 *
 * @param source `watcher` (app open) or `tracker` (background, reliable mode).
 */
export async function checkZonesAt(position: Location.LocationObject, source: EventSource): Promise<void> {
  if (isChecking) {
    pending = { position, source };
    return;
  }
  isChecking = true;
  try {
    let next: { position: Location.LocationObject; source: EventSource } | null = { position, source };
    while (next) {
      const current: { position: Location.LocationObject; source: EventSource } = next;
      pending = null;
      await checkOnce(current.position, current.source);
      next = pending;
    }
  } finally {
    isChecking = false;
  }
}

async function checkOnce(position: Location.LocationObject, source: EventSource): Promise<void> {
  try {
    const zones = (await getAllZones()).filter((zone) => zone.active);
    const inside = await readInside();
    const accuracy = position.coords.accuracy ?? 0;

    for (const zone of zones) {
      const distance = distanceMeters(position.coords, zone);
      const isInsideNow = distance <= zone.radius;
      const wasInside = inside[zone.id] !== undefined;
      const isClearlyOutside = distance > zone.radius + exitMargin(zone.radius) && accuracy <= MAX_ACCURACY_FOR_EXIT;

      if (isInsideNow && !wasInside) await handleGeofenceEvent(zone.id, 'enter', source);
      else if (wasInside && isClearlyOutside) await handleGeofenceEvent(zone.id, 'exit', source);
    }

    // Forget zones that were deleted or paused, so they start fresh when turned on again.
    const fresh = await readInside();
    let changed = false;
    for (const zoneId of Object.keys(fresh)) {
      if (!zones.some((zone) => zone.id === zoneId)) {
        delete fresh[zoneId];
        changed = true;
      }
    }
    if (changed) await writeInside(fresh);
  } catch (error) {
    console.warn('[zones] check failed', error);
  }
}
