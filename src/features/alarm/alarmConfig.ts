/**
 * **Alarm settings** — one place for everything about how the alarm behaves.
 *
 * The alarm is its own module (`src/features/alarm/`) so it can grow on its own
 * later (choose a sound, gradual volume, "dismiss by shaking", math puzzle…)
 * without touching the notification or location code.
 *
 * | File | What |
 * |---|---|
 * | `alarmConfig.ts` | these settings |
 * | `alarmSound.ts` | plays the sound + vibration while the app is open |
 * | `AlarmScreen.tsx` | the full-screen alarm (Stop · Snooze · Open zone) |
 *
 * When the app is **closed**, Android plays the alarm notification's own sound
 * (channel `geo-alarms-v1` in `notifications/notifications.ts`, file
 * `assets/sounds/alarm.wav`). Changing that sound needs a new channel id.
 *
 * @module features/alarm/alarmConfig
 * @category Feature: Alarm
 */

export const ALARM_CONFIG = {
  /** Background of the alarm screen (same in light and dark mode). */
  color: '#EA580C',
  /** The in-app alarm stops by itself after this long (ms). */
  maxDurationMs: 3 * 60 * 1000,
  /** Vibration: wait 0 ms, vibrate 800 ms, pause 600 ms — repeated. */
  vibrationPattern: [0, 800, 600],
  /** Sound volume while the app is open (0 – 1). */
  volume: 1,
  /** "Snooze" on the alarm screen rings again after this many minutes. */
  snoozeMinutes: 5,
} as const;
