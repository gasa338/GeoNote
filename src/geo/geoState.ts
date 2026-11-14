/**
 * Small pieces of tracking state that must survive the app being closed.
 *
 * - **Inside map**: which zones the user is currently inside. Prevents a second
 *   "arrived" notification when the system re-registers circles.
 * - **Tracking status**: what was registered last time, shown in the UI.
 *
 * @module geo/geoState
 * @category Location
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const INSIDE_STORAGE_KEY = 'geonote:inside:v2';
const STATUS_STORAGE_KEY = 'geonote:geofence-status:v1';
const REGISTERED_AT_STORAGE_KEY = 'geonote:geofence-registered-at:v1';
const SIGNATURE_STORAGE_KEY = 'geonote:geofence-signature:v1';

/**
 * Remembers which circles were registered last time, so they are registered
 * again only when something changed. (Every registration makes the system
 * forget where the user is and re-report everything — reminders around that
 * moment would be lost.)
 */
export async function writeRegionsSignature(signature: string): Promise<void> {
  await AsyncStorage.setItem(SIGNATURE_STORAGE_KEY, signature);
}

/** The circles registered last time (see {@link writeRegionsSignature}). */
export async function readRegionsSignature(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SIGNATURE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Remembers when zones were last registered with the system (see `INITIAL_STATE_WINDOW_MS`). */
export async function writeRegisteredAt(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(REGISTERED_AT_STORAGE_KEY, String(timestamp));
}

/** when zones were last registered with the system (0 if never). */
export async function readRegisteredAt(): Promise<number> {
  try {
    return Number((await AsyncStorage.getItem(REGISTERED_AT_STORAGE_KEY)) ?? 0) || 0;
  } catch {
    return 0;
  }
}

/** `zoneId → ISO time the user entered it`. */
export type InsideMap = Record<string, string>;

/** Reads which zones the user is currently inside. */
export async function readInside(): Promise<InsideMap> {
  try {
    const json = await AsyncStorage.getItem(INSIDE_STORAGE_KEY);
    return json ? (JSON.parse(json) as InsideMap) : {};
  } catch {
    return {};
  }
}

/** Saves which zones the user is currently inside. */
export async function writeInside(inside: InsideMap): Promise<void> {
  await AsyncStorage.setItem(INSIDE_STORAGE_KEY, JSON.stringify(inside));
}

/**
 * - `active` — zones are being watched
 * - `idle` — nothing to watch (no active zones)
 * - `no-permission` — location permission missing
 * - `error` — registering failed (see `error`)
 */
export type GeofenceState = 'active' | 'idle' | 'no-permission' | 'error';

/** Result of the last tracking refresh. */
export interface GeofenceStatus {
  state: GeofenceState;
  /**
   * `background` — real geofencing by the operating system (works when the app is closed).
   * `foreground` — Expo Go test mode (works only while the app is open).
   */
  mode?: 'background' | 'foreground';
  /** How many zones the phone watches right now. */
  monitored: number;
  /** How many zones are active. */
  total: number;
  /** True if there are more zones than the phone can watch at once. */
  usesRefreshRegion: boolean;
  /** ISO time of this refresh. */
  updatedAt: string;
  /** Error message when `state` is `error`. */
  error?: string;
  /** Reliable mode: the background tracker (permanent notification) is running. */
  reliable?: boolean;
}

/** Reads the last saved tracking status (or `null` before the first refresh). */
export async function readGeofenceStatus(): Promise<GeofenceStatus | null> {
  try {
    const json = await AsyncStorage.getItem(STATUS_STORAGE_KEY);
    return json ? (JSON.parse(json) as GeofenceStatus) : null;
  } catch {
    return null;
  }
}

/** Saves the tracking status. */
export async function writeGeofenceStatus(status: GeofenceStatus): Promise<void> {
  await AsyncStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(status));
}
