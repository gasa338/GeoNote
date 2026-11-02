/**
 * Reading and writing **zones** on the phone.
 *
 * All zones are one JSON array in AsyncStorage under {@link ZONES_STORAGE_KEY}.
 * Each function does exactly what its name says — no hidden caching.
 * These functions also work from the background geofence task (app closed).
 *
 * ### Upgrade from version 1.x
 * Older versions stored "places" and "reminders" separately. The first time
 * zones are read, `migrateFromV1` turns every reminder into a zone (using
 * its place's location) and every place without reminders into a paused zone.
 * The old data is left untouched, so nothing is lost.
 *
 * ### Later: Django API
 * Replace the bodies with `apiRequest()` calls (`src/data/api/client.ts`),
 * or keep this local copy and add a sync step (recommended — the background
 * task must work without internet).
 *
 * @module data/zones
 * @category Data
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { newId } from '@/utils/id';

import type { ChecklistItem, ID, Zone, ZoneInput } from './types';

/** AsyncStorage key that holds the JSON array of zones. */
export const ZONES_STORAGE_KEY = 'geonote:zones:v2';

/** Keys used by version 1.x (read once for the upgrade). */
const V1_PLACES_KEY = 'geonote:places:v1';
const V1_REMINDERS_KEY = 'geonote:reminders:v1';

/** Shape of version 1.x records (only the fields we need). */
interface V1Place {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius: number;
}
interface V1Reminder {
  placeId: string;
  title: string;
  note: string;
  trigger: Zone['trigger'];
  repeat: Zone['repeat'];
  alertStyle?: Zone['alertStyle'];
  active: boolean;
  resetChecklistOnTrigger: boolean;
  checklist: ChecklistItem[];
  lastTriggeredAt: string | null;
}

/** Default values for a new zone (used by the editor and the upgrade). */
export function emptyZoneInput(): ZoneInput {
  return {
    name: '',
    address: null,
    latitude: 0,
    longitude: 0,
    radius: 200,
    kind: 'personal',
    contentMode: 'list',
    note: '',
    checklist: [],
    trigger: 'enter',
    repeat: 'always',
    alertStyle: 'notification',
    active: true,
    resetChecklistOnTrigger: false,
  };
}

/** Converts version 1.x places + reminders into zones. Returns `[]` if there is nothing to convert. */
async function migrateFromV1(): Promise<Zone[]> {
  try {
    const placesJson = await AsyncStorage.getItem(V1_PLACES_KEY);
    if (!placesJson) return [];
    const places = JSON.parse(placesJson) as V1Place[];
    const reminders = JSON.parse((await AsyncStorage.getItem(V1_REMINDERS_KEY)) ?? '[]') as V1Reminder[];
    const now = new Date().toISOString();
    const zones: Zone[] = [];

    for (const place of places) {
      const location = {
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        radius: place.radius,
      };
      const placeReminders = reminders.filter((reminder) => reminder.placeId === place.id);

      if (placeReminders.length === 0) {
        zones.push({ ...emptyZoneInput(), ...location, active: false, id: newId(), lastTriggeredAt: null, createdAt: now, updatedAt: now });
      }
      for (const reminder of placeReminders) {
        const note = [reminder.title, reminder.note].filter((text) => text && text.trim()).join('\n');
        zones.push({
          ...emptyZoneInput(),
          ...location,
          contentMode: reminder.checklist.length > 0 ? 'list' : 'note',
          note,
          checklist: reminder.checklist,
          trigger: reminder.trigger,
          repeat: reminder.repeat,
          alertStyle: reminder.alertStyle ?? 'notification',
          active: reminder.active,
          resetChecklistOnTrigger: reminder.resetChecklistOnTrigger,
          lastTriggeredAt: reminder.lastTriggeredAt,
          id: newId(),
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    return zones;
  } catch (error) {
    console.warn('[zones] upgrade from v1 failed', error);
    return [];
  }
}

/** Returns every saved zone (upgrading old data the first time). */
export async function getAllZones(): Promise<Zone[]> {
  try {
    const json = await AsyncStorage.getItem(ZONES_STORAGE_KEY);
    if (json) return JSON.parse(json) as Zone[];

    // No zones saved yet: maybe this phone has data from version 1.x.
    const migrated = await migrateFromV1();
    await saveAllZones(migrated);
    return migrated;
  } catch (error) {
    console.warn('[zones] could not read zones', error);
    return [];
  }
}

/** Overwrites the whole list of zones. */
async function saveAllZones(zones: Zone[]): Promise<void> {
  await AsyncStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zones));
}

/** Returns one zone, or `null` if it does not exist. */
export async function getZoneById(id: ID): Promise<Zone | null> {
  const zones = await getAllZones();
  return zones.find((zone) => zone.id === id) ?? null;
}

/** Creates a new zone and returns it (with its new id). */
export async function createZone(input: ZoneInput): Promise<Zone> {
  const now = new Date().toISOString();
  const zone: Zone = { ...input, id: newId(), lastTriggeredAt: null, createdAt: now, updatedAt: now };
  const zones = await getAllZones();
  zones.push(zone);
  await saveAllZones(zones);
  return zone;
}

/** Changes some fields of a zone and returns the updated zone. */
export async function updateZone(id: ID, changes: Partial<Zone>): Promise<Zone> {
  const zones = await getAllZones();
  const index = zones.findIndex((zone) => zone.id === id);
  if (index === -1) throw new Error(`Zone ${id} not found`);
  zones[index] = { ...zones[index], ...changes, id, updatedAt: new Date().toISOString() };
  await saveAllZones(zones);
  return zones[index];
}

/** Deletes one zone. */
export async function deleteZone(id: ID): Promise<void> {
  const zones = await getAllZones();
  await saveAllZones(zones.filter((zone) => zone.id !== id));
}
