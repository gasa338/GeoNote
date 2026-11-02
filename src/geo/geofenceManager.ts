/**
 * Tells the phone **which zones to watch**.
 *
 * Called on app start, when the app comes back to the foreground, after every
 * change to zones, and from the background task.
 *
 * Two watchers work together:
 * 1. **While the app is open** (Expo Go *and* real build): `foregroundWatcher`
 *    follows the GPS position and reacts within seconds.
 * 2. **When the app is closed** (real build only): the operating system watches
 *    circles registered here and wakes `geofenceTask`. This is slower — on
 *    Android it can take 1–3 minutes after you enter a zone.
 * Both send events to `reminderEngine`, which makes sure a zone fires only once.
 *
 * If there are more zones than the phone allows ({@link MAX_REGIONS}), the
 * nearest ones are registered plus one big helper circle around the user;
 * leaving it triggers this refresh again.
 *
 * @module geo/geofenceManager
 * @category Location
 */
import * as Location from 'expo-location';

import { addLogEntry } from '@/data/activityLog';
import { getAllZones } from '@/data/zones';
import { distanceMeters } from '@/utils/geo';
import { IS_EXPO_GO } from '@/utils/runtime';

import { GEOFENCE_TASK, MAX_REGIONS, MIN_RADIUS, REFRESH_REGION_ID } from './constants';
import { checkPositionNow, startForegroundWatcher } from './foregroundWatcher';
import { readInside, writeGeofenceStatus, writeInside, writeRegisteredAt, type GeofenceStatus } from './geoState';

/**
 * The refresh that is currently running (if any). Refreshes can be requested
 * quickly one after another, so each waits for the previous one.
 */
let lastRefresh: Promise<GeofenceStatus | void> = Promise.resolve();

/** Options for {@link refreshGeofences}. */
export interface RefreshOptions {
  /** Known position; if omitted, the last known position is used. */
  position?: Location.LocationObject | null;
  /** Called from the background task — do not start the foreground watcher. */
  fromBackground?: boolean;
}

/** Re-registers the watched zones and returns the new status. */
export function refreshGeofences(options: RefreshOptions = {}): Promise<GeofenceStatus> {
  const run = lastRefresh.catch(() => undefined).then(() => doRefresh(options));
  lastRefresh = run;
  return run;
}

/** Saves a status (adds the current time) and returns it. */
async function saveStatus(status: Omit<GeofenceStatus, 'updatedAt'>): Promise<GeofenceStatus> {
  const fullStatus: GeofenceStatus = { ...status, updatedAt: new Date().toISOString() };
  await writeGeofenceStatus(fullStatus);
  return fullStatus;
}

/** Returns the last known position, or asks for a fresh one (max 8 seconds). */
async function getBestPosition(): Promise<Location.LocationObject | null> {
  try {
    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
    if (lastKnown) return lastKnown;
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
    return await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), timeout]);
  } catch {
    return null;
  }
}

/** Stops system geofencing if it is running. */
async function stopSystemGeofencing(): Promise<void> {
  try {
    if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) await Location.stopGeofencingAsync(GEOFENCE_TASK);
  } catch {
    // The task may not be registered yet — that is fine.
  }
}

/** Does the actual work of {@link refreshGeofences}. */
async function doRefresh(options: RefreshOptions): Promise<GeofenceStatus> {
  try {
    const allZones = await getAllZones();
    const activeZones = allZones.filter((zone) => zone.active);

    // ---- 1. While the app is open: follow the GPS position ------------------
    if (!options.fromBackground) {
      const watching = await startForegroundWatcher();
      if (watching) checkPositionNow();
    }

    // ---- Expo Go: no background tracking possible --------------------------
    if (IS_EXPO_GO) {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        return saveStatus({ state: 'no-permission', mode: 'foreground', monitored: 0, total: activeZones.length, usesRefreshRegion: false });
      }
      return saveStatus({
        state: activeZones.length > 0 ? 'active' : 'idle',
        mode: 'foreground',
        monitored: activeZones.length,
        total: activeZones.length,
        usesRefreshRegion: false,
      });
    }

    // ---- 2. Real build: let the operating system watch (also when closed) ----
    const background = await Location.getBackgroundPermissionsAsync();
    if (background.status !== 'granted') {
      await stopSystemGeofencing();
      void addLogEntry('info', 'Background tracking off: location "Allow all the time" is not granted.');
      return saveStatus({ state: 'no-permission', mode: 'background', monitored: 0, total: activeZones.length, usesRefreshRegion: false });
    }

    // Forget "inside" entries for zones that were deleted.
    const inside = await readInside();
    for (const zoneId of Object.keys(inside)) {
      if (!allZones.some((zone) => zone.id === zoneId)) delete inside[zoneId];
    }
    await writeInside(inside);

    if (activeZones.length === 0) {
      await stopSystemGeofencing();
      return saveStatus({ state: 'idle', mode: 'background', monitored: 0, total: 0, usesRefreshRegion: false });
    }

    // Nearest zones first.
    const currentPosition = options.position === undefined ? await getBestPosition() : options.position;
    const here = currentPosition?.coords;
    const zonesByDistance = activeZones
      .map((zone) => ({ zone, distance: here ? distanceMeters(here, zone) : 0 }))
      .sort((a, b) => a.distance - b.distance);

    // Too many zones? Keep the nearest ones and add the helper circle.
    const useHelperCircle = zonesByDistance.length > MAX_REGIONS && here !== undefined;
    const watched = zonesByDistance.slice(0, useHelperCircle ? MAX_REGIONS - 1 : MAX_REGIONS);

    const regions: Location.LocationRegion[] = watched.map(({ zone }) => ({
      identifier: zone.id,
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: Math.max(zone.radius, MIN_RADIUS),
      notifyOnEnter: true,
      notifyOnExit: true, // needed for "when I leave" zones and for tracking "inside"
    }));

    if (useHelperCircle && here) {
      const farthestWatched = watched[watched.length - 1]?.distance ?? 2000;
      regions.push({
        identifier: REFRESH_REGION_ID,
        latitude: here.latitude,
        longitude: here.longitude,
        radius: Math.min(Math.max(farthestWatched * 0.5, 1000), 50000),
        notifyOnEnter: false,
        notifyOnExit: true,
      });
    }

    // The system now reports the current state of every zone — remember when,
    // so reminderEngine does not treat those reports as real arrivals.
    await writeRegisteredAt(Date.now());
    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);

    return saveStatus({
      state: 'active',
      mode: 'background',
      monitored: watched.length,
      total: activeZones.length,
      usesRefreshRegion: useHelperCircle,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void addLogEntry('error', `Tracking could not start: ${message}`);
    return saveStatus({
      state: 'error',
      mode: IS_EXPO_GO ? 'foreground' : 'background',
      monitored: 0,
      total: 0,
      usesRefreshRegion: false,
      error: message,
    });
  }
}
