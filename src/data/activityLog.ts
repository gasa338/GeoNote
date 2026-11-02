/**
 * **Activity log** — a short history of what location tracking did and why.
 *
 * Shown in Settings → Location & notifications → Activity. When a reminder does
 * not pop up, the log tells you the reason (e.g. "Ignored: you were already
 * inside", "Ignored: no notification permission").
 *
 * Only the last {@link MAX_LOG_ENTRIES} entries are kept.
 *
 * @module data/activityLog
 * @category Data
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_STORAGE_KEY = 'geonote:activity-log:v1';

/** How many entries are kept. */
export const MAX_LOG_ENTRIES = 40;

/**
 * What happened:
 * - `fired` — a notification / alarm was shown
 * - `skipped` — an event came in but no reminder was shown (see `detail`)
 * - `info` — anything else worth knowing (tracking started, permission missing…)
 * - `error` — something failed
 */
export type LogKind = 'fired' | 'skipped' | 'info' | 'error';

/** One line of the log. Texts are stored in English (developer log). */
export interface LogEntry {
  time: string;
  kind: LogKind;
  message: string;
}

/** Adds a line to the log (newest first). Never throws. */
export async function addLogEntry(kind: LogKind, message: string): Promise<void> {
  try {
    const entries = await readLog();
    entries.unshift({ time: new Date().toISOString(), kind, message });
    await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_LOG_ENTRIES)));
  } catch {
    // The log must never break the app.
  }
  if (__DEV__) console.log(`[activity] ${kind}: ${message}`);
}

/** Returns the log, newest first. */
export async function readLog(): Promise<LogEntry[]> {
  try {
    const json = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    return json ? (JSON.parse(json) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

/** Deletes the whole log. */
export async function clearLog(): Promise<void> {
  await AsyncStorage.removeItem(LOG_STORAGE_KEY);
}
