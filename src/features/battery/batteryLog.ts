/**
 * **Battery log** — what Blizu can measure about battery use.
 *
 * Android does not let an app read its own exact share of battery use (only
 * the system's Battery screen shows that). So Blizu records what it can:
 * - the phone's battery level over time (a sample at most every 15 minutes),
 * - how many GPS positions Blizu used per hour.
 *
 * Saved under the AsyncStorage key `geonote:battery:v1`.
 *
 * @module features/battery/batteryLog
 * @category Feature: Battery
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';

const STORAGE_KEY = 'geonote:battery:v1';
/** Keep samples and counts for this long. */
const KEEP_MS = 48 * 60 * 60 * 1000;
/** At most one battery sample per this period. */
const SAMPLE_EVERY_MS = 15 * 60 * 1000;

/** One battery reading. */
export interface BatterySample {
  at: string;
  /** 0 – 1 */
  level: number;
  charging: boolean;
}

export interface BatteryLog {
  samples: BatterySample[];
  /** GPS positions used, per hour: `{ "2026-11-14T15": 42 }`. */
  positionsPerHour: Record<string, number>;
}

const EMPTY: BatteryLog = { samples: [], positionsPerHour: {} };

export async function readBatteryLog(): Promise<BatteryLog> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? { ...EMPTY, ...(JSON.parse(json) as Partial<BatteryLog>) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

async function save(log: BatteryLog): Promise<void> {
  const cutoff = Date.now() - KEEP_MS;
  const cutoffHour = new Date(cutoff).toISOString().slice(0, 13);
  const positionsPerHour: Record<string, number> = {};
  for (const [hour, count] of Object.entries(log.positionsPerHour)) if (hour >= cutoffHour) positionsPerHour[hour] = count;
  const trimmed: BatteryLog = { samples: log.samples.filter((sample) => Date.parse(sample.at) >= cutoff), positionsPerHour };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/** Counts GPS positions used by Blizu (called by the GPS sources). */
let unsavedPositions = 0;
let lastFlush = 0;
export async function countPositions(count = 1): Promise<void> {
  unsavedPositions += count;
  // Saving on every position would itself cost battery — save at most once a minute.
  if (Date.now() - lastFlush < 60 * 1000) return;
  lastFlush = Date.now();
  const add = unsavedPositions;
  unsavedPositions = 0;
  const log = await readBatteryLog();
  const hour = new Date().toISOString().slice(0, 13);
  log.positionsPerHour[hour] = (log.positionsPerHour[hour] ?? 0) + add;
  await save(log);
}

/** Saves the current battery level (at most every 15 minutes, unless `force`). */
export async function sampleBattery(force = false): Promise<void> {
  try {
    const log = await readBatteryLog();
    const last = log.samples[log.samples.length - 1];
    if (!force && last && Date.now() - Date.parse(last.at) < SAMPLE_EVERY_MS) return;
    const state = await Battery.getPowerStateAsync();
    if (state.batteryLevel < 0) return; // unknown (emulator, web)
    const charging = state.batteryState === Battery.BatteryState.CHARGING || state.batteryState === Battery.BatteryState.FULL;
    log.samples.push({ at: new Date().toISOString(), level: state.batteryLevel, charging });
    await save(log);
  } catch {
    // Battery info is optional.
  }
}

/** Summary for the screen. */
export interface BatterySummary {
  /** Phone battery drop per hour while not charging (percent points), or `null` if not enough data yet. */
  drainPerHour: number | null;
  /** Hours of not-charging time that the drain is based on. */
  measuredHours: number;
  /** GPS positions Blizu used in the last 24 hours. */
  positions24h: number;
}

export function summarize(log: BatteryLog): BatterySummary {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const samples = log.samples.filter((sample) => Date.parse(sample.at) >= dayAgo);

  // Add up drops between neighbouring samples where the phone was not charging.
  let drop = 0;
  let hours = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const before = samples[i - 1];
    const after = samples[i];
    if (before.charging || after.charging || after.level > before.level) continue;
    drop += (before.level - after.level) * 100;
    hours += (Date.parse(after.at) - Date.parse(before.at)) / (60 * 60 * 1000);
  }

  const dayAgoHour = new Date(dayAgo).toISOString().slice(0, 13);
  const positions24h = Object.entries(log.positionsPerHour)
    .filter(([hour]) => hour >= dayAgoHour)
    .reduce((sum, [, count]) => sum + count, 0);

  return { drainPerHour: hours >= 1 ? drop / hours : null, measuredHours: hours, positions24h };
}
