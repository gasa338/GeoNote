/**
 * **App health settings** — how the app watches itself.
 *
 * Phones (Xiaomi, Samsung, Huawei…) can put GeoNote to sleep to save battery.
 * Then the system stops sending "you arrived" events and reminders do not pop
 * up — silently. This module notices that and tells the user.
 *
 * @module features/health/healthConfig
 * @category Feature: Health
 */

export const HEALTH_CONFIG = {
  /** Name of the periodic background check (expo-background-task). */
  taskName: 'GeoNote-health-check',
  /** How often the background check should run, in minutes (Android minimum: 15). The phone may run it later. */
  checkIntervalMinutes: 60,
  /**
   * "Watchdog": every sign of life moves a scheduled notification this many
   * hours into the future. If the app is put to sleep, nothing moves it any
   * more and the phone itself shows "GeoNote may be asleep".
   */
  watchdogHours: 12,
  /** No sign of life for this long = the app was asleep (shown when the app opens). */
  sleepGapHours: 12,
  /** The same problem is announced by a notification at most once per this many hours. */
  repeatProblemNoticeHours: 24,
  /**
   * A reminder caught by the GPS within this time after opening the app
   * (and not reported by the system before) counts as "caught late".
   */
  lateCatchWindowMs: 60 * 1000,
  /** How many late catches are remembered. */
  maxLateCatches: 10,
} as const;
