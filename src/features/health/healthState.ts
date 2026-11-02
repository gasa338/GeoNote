/**
 * Saved state of the health watcher (AsyncStorage key `geonote:health:v1`),
 * plus a tiny "something changed" signal for the screens.
 *
 * @module features/health/healthState
 * @category Feature: Health
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'geonote:health:v1';

/** What can be wrong. `error` = reminders will not pop up, `warning` = they may be late. */
export type HealthProblemId =
  | 'location-off'
  | 'no-location'
  | 'no-background'
  | 'no-notifications'
  | 'tracking-stopped'
  | 'background-restricted'
  | 'battery-optimized'
  | 'power-saver'
  | 'was-asleep'
  | 'caught-late';

export interface HealthProblem {
  id: HealthProblemId;
  severity: 'error' | 'warning';
}

/** Where a sign of life came from. */
export type AliveSource = 'app' | 'background-check' | 'zone-event';

/** Result of the last check. */
export interface HealthReport {
  checkedAt: string;
  source: AliveSource;
  /** Number of active zones at that time (0 = nothing to watch, no problems reported). */
  activeZones: number;
  problems: HealthProblem[];
}

/** A period when the app showed no sign of life. */
export interface SleepGap {
  from: string;
  to: string;
}

/** A reminder that the system did not report — found by the GPS after opening the app. */
export interface LateCatch {
  zoneName: string;
  at: string;
}

export interface HealthState {
  /** Last sign of life (any source). */
  lastAliveAt: string | null;
  lastAliveSource: AliveSource | null;
  /** Last time the periodic background check ran. */
  lastBackgroundCheckAt: string | null;
  report: HealthReport | null;
  /** The last sleep gap found when the app opened. */
  lastGap: SleepGap | null;
  lateCatches: LateCatch[];
  /** When each problem was last announced by a notification. */
  notifiedAt: Partial<Record<HealthProblemId, string>>;
}

const EMPTY: HealthState = {
  lastAliveAt: null,
  lastAliveSource: null,
  lastBackgroundCheckAt: null,
  report: null,
  lastGap: null,
  lateCatches: [],
  notifiedAt: {},
};

export async function readHealthState(): Promise<HealthState> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? { ...EMPTY, ...(JSON.parse(json) as Partial<HealthState>) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

/** Reads, changes and saves the state; tells listeners. Returns the new state. */
export async function updateHealthState(change: (state: HealthState) => HealthState): Promise<HealthState> {
  const next = change(await readHealthState());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener(next));
  return next;
}

// ---- "Something changed" signal (for screens that show the state) -------------

const listeners = new Set<(state: HealthState) => void>();

/** Calls `listener` whenever the health state is saved. Returns the unsubscribe function. */
export function subscribeHealth(listener: (state: HealthState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
