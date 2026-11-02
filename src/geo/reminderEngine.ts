/**
 * What happens when the user **enters or leaves** a zone.
 *
 * Called by:
 * - `foregroundWatcher.ts` while the app is open (seconds after arriving),
 * - `geofenceTask.ts` when the app is closed (real build),
 * - the store, right after saving a zone you are standing in,
 * - the "Arrive at …" test button.
 *
 * Steps:
 * 1. Decide if this is a real arrival/departure (and remember the new state):
 *    - ignore the state report the system sends right after registering zones,
 *    - ignore "enter" while we already know the user is inside,
 *    - ignore "exit" from a zone the user was never inside.
 * 2. Check the zone: active, matching trigger (enter / exit / both), not fired
 *    for the same event in the last 10 minutes.
 * 3. Show the notification or alarm.
 * 4. Update the zone: last fired time, turn off "once" zones, reset the checklist.
 *
 * Every decision is written to the **activity log** (`data/activityLog.ts`),
 * so you can see in Settings why a reminder did or did not pop up.
 *
 * @module geo/reminderEngine
 * @category Location
 */
import * as Notifications from 'expo-notifications';

import { addLogEntry } from '@/data/activityLog';
import type { ZoneEvent, Zone } from '@/data/types';
import { getZoneById, updateZone } from '@/data/zones';
import { recordLateCatch, wasJustOpened } from '@/features/health/healthCheck';
import { showZoneNotification } from '@/notifications/notifications';

import { INITIAL_STATE_WINDOW_MS, INSIDE_STALE_MS, TRIGGER_COOLDOWN_MS } from './constants';
import { refreshGeofences } from './geofenceManager';
import { readInside, readRegisteredAt, writeInside } from './geoState';

/** Who reports the event (changes which checks apply). */
export type EventSource =
  /** The operating system (background task). */
  | 'system'
  /** The GPS watcher while the app is open. */
  | 'watcher'
  /** The zone was just saved while the user stands inside it. */
  | 'saved'
  /** The test button in Settings: always fires. */
  | 'test';

/**
 * Handles one enter/exit event for one zone.
 *
 * @param zoneId The zone the user entered or left.
 * @param event  What happened: `'enter'` or `'exit'`.
 * @param source Who reports it (see {@link EventSource}).
 */
export async function handleGeofenceEvent(zoneId: string, event: ZoneEvent, source: EventSource): Promise<void> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const zone = await getZoneById(zoneId);
  const name = zone?.name ?? zoneId;

  // 1. Real arrival/departure? Remember the new state.
  const inside = await readInside();
  const enteredAt = inside[zoneId];
  const wasInside = enteredAt !== undefined && now - Date.parse(enteredAt) < INSIDE_STALE_MS;
  if (event === 'enter') inside[zoneId] = wasInside ? enteredAt : nowIso;
  else delete inside[zoneId];
  await writeInside(inside);

  if (source === 'system') {
    const registeredAt = await readRegisteredAt();
    if (now - registeredAt < INITIAL_STATE_WINDOW_MS) {
      void addLogEntry('skipped', `${name}: start-up state report (${event}), not a real ${event === 'enter' ? 'arrival' : 'departure'}.`);
      return;
    }
  }
  if (source === 'system' || source === 'watcher') {
    if (event === 'enter' && wasInside) return; // already known — the other watcher was faster
    if (event === 'exit' && !wasInside) return;
  }

  // 2. Should this zone fire?
  if (!zone) return;
  const reason = whyNotFire(zone, event, now, source);
  if (reason) {
    void addLogEntry('skipped', `${name}: ${event === 'enter' ? 'arrived' : 'left'}, but ${reason}.`);
    return;
  }

  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    void addLogEntry('skipped', `${name}: ${event === 'enter' ? 'arrived' : 'left'}, but notifications are not allowed for the app.`);
    return;
  }

  // The system never reported this arrival and the GPS caught it only now,
  // right after the app was opened → the phone had put GeoNote to sleep.
  if (source === 'watcher' && event === 'enter' && wasJustOpened()) await recordLateCatch(name);

  // 3. Show it.
  try {
    await showZoneNotification(zone, event);
    void addLogEntry('fired', `${name}: ${zone.alertStyle === 'alarm' ? 'alarm' : 'notification'} shown (${event === 'enter' ? 'arrived' : 'left'}, via ${source}).`);
  } catch (error) {
    void addLogEntry('error', `${name}: notification failed — ${error instanceof Error ? error.message : String(error)}`);
  }

  // 4. Update the zone.
  const changes: Partial<Zone> = { lastTriggeredAt: nowIso, lastTriggerEvent: event };
  // "Once" turns the zone off after it fired. With trigger "both" that is after
  // leaving, so arriving AND leaving each pop up one time.
  if (zone.repeat === 'once' && (zone.trigger !== 'both' || event === 'exit')) changes.active = false;
  if (zone.resetChecklistOnTrigger && zone.checklist.some((item) => item.done)) {
    changes.checklist = zone.checklist.map((item) => ({ ...item, done: false }));
  }
  await updateZone(zone.id, changes);

  // A "once" zone turned itself off — it no longer needs watching.
  if (changes.active === false) await refreshGeofences({ fromBackground: source === 'system' });
}

/** Returns why a zone should NOT fire now, or `null` if it should. */
function whyNotFire(zone: Zone, event: ZoneEvent, now: number, source: EventSource): string | null {
  if (source === 'test') return null;
  if (!zone.active) return 'the zone is paused';
  if (zone.trigger !== 'both' && zone.trigger !== event) return `the zone reminds on ${zone.trigger === 'enter' ? 'arrival' : 'leaving'}`;
  // The 10-minute pause applies to the same event only (arrive → leave still pops up).
  const sameEventAsLastTime = zone.trigger !== 'both' || !zone.lastTriggerEvent || zone.lastTriggerEvent === event;
  if (sameEventAsLastTime && zone.lastTriggeredAt && now - Date.parse(zone.lastTriggeredAt) < TRIGGER_COOLDOWN_MS) {
    return 'it already popped up less than 10 minutes ago';
  }
  return null;
}
