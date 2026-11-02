/**
 * The **in-app alarm**: loops the alarm sound and vibrates until stopped.
 *
 * Used by the alarm screen (`AlarmScreen.tsx`) while the app is open.
 * When the app is closed, the alarm notification's own sound rings instead
 * (see `notifications/notifications.ts`). Settings: `alarmConfig.ts`.
 *
 * The sound file is `assets/sounds/alarm.wav` (an original 30-second beep pattern).
 * To use a different sound, replace that file — keep the name, WAV format, max 30 s.
 *
 * @module features/alarm/alarmSound
 * @category Feature: Alarm
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';

import { ALARM_CONFIG } from './alarmConfig';

/** The player while the alarm rings, otherwise `null`. */
let player: AudioPlayer | null = null;
/** Timer that stops the alarm automatically after `ALARM_CONFIG.maxDurationMs`. */
let autoStopTimer: ReturnType<typeof setTimeout> | null = null;

/** Starts ringing (does nothing if it already rings). */
export async function startAlarmSound(): Promise<void> {
  if (player) return;

  try {
    // Play even when the phone is on silent, and pause music from other apps.
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' });
    player = createAudioPlayer(require('../../assets/sounds/alarm.wav'));
    player.loop = true;
    player.volume = ALARM_CONFIG.volume;
    player.play();
  } catch (error) {
    console.warn('[alarm] sound could not start', error);
  }

  Vibration.vibrate([...ALARM_CONFIG.vibrationPattern], true);
  autoStopTimer = setTimeout(stopAlarmSound, ALARM_CONFIG.maxDurationMs);
}

/** Stops the sound and the vibration. Safe to call any time. */
export function stopAlarmSound(): void {
  if (autoStopTimer) clearTimeout(autoStopTimer);
  autoStopTimer = null;

  Vibration.cancel();

  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // already released
    }
    player = null;
  }
}
