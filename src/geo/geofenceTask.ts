/**
 * The **background task** the operating system runs when the user enters or
 * leaves a watched zone — even when the app is closed.
 *
 * ⚠️ This file must be imported at the very top of `src/app/_layout.tsx`.
 * When the system starts the app in the background only for a geofence event,
 * the task has to be defined immediately, before anything else runs.
 *
 * Not used in Expo Go (see `foregroundWatcher.ts`).
 *
 * @module geo/geofenceTask
 * @category Location
 */
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { markZoneEventAlive } from '@/features/health/healthCheck';

import { GEOFENCE_TASK, REFRESH_REGION_ID } from './constants';
import { refreshGeofences } from './geofenceManager';
import { handleGeofenceEvent } from './reminderEngine';

/** What the operating system sends to the task. */
interface GeofenceEventData {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
}

TaskManager.defineTask<GeofenceEventData>(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[geofence-task] error', error.message);
    return;
  }

  const regionId = data?.region?.identifier;
  if (!regionId) return;

  const entered = data.eventType === Location.GeofencingEventType.Enter;

  // Any event from the system = the app is alive (moves the watchdog, see features/health).
  void markZoneEventAlive().catch(() => undefined);

  try {
    // The helper circle around the user: they moved far away, pick the nearest zones again.
    if (regionId === REFRESH_REGION_ID) {
      if (!entered) await refreshGeofences({ fromBackground: true });
      return;
    }

    // A real zone: the region id is the zone id.
    await handleGeofenceEvent(regionId, entered ? 'enter' : 'exit', 'system');
  } catch (taskError) {
    console.warn('[geofence-task] failed', taskError);
  }
});
