/**
 * Showing **local notifications** (no server, no push) — normal ones and alarms.
 *
 * Two kinds, chosen per zone (`Zone.alertStyle`):
 *
 * | | Notification | Alarm |
 * |---|---|---|
 * | Android channel | {@link REMINDER_CHANNEL_ID} | {@link ALARM_CHANNEL_ID} (alarm volume, max importance) |
 * | Sound | short system sound | `alarm.wav`, 30 s (real build only) |
 * | Swipe away | yes | no — press **Stop** or tap it |
 * | App open | banner | full-screen alarm that rings until "Stop" |
 *
 * Notification texts use the language saved in settings, so they are correct
 * even when the background task runs with the app closed.
 *
 * @module notifications/notifications
 * @category Notifications
 */
import * as Notifications from 'expo-notifications';
import {
  AndroidAudioContentType,
  AndroidAudioUsage,
  AndroidImportance,
  AndroidNotificationPriority,
  AndroidNotificationVisibility,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { getSettings } from '@/data/settings';
import type { AlertStyle, Zone, ZoneEvent } from '@/data/types';
import { getDictionary } from '@/i18n/dictionaries';
import { IS_EXPO_GO } from '@/utils/runtime';

/** Android channel for normal reminder notifications. */
export const REMINDER_CHANNEL_ID = 'geo-reminders';
/** Android channel for app-status messages (quiet, default importance). */
export const STATUS_CHANNEL_ID = 'app-status';

/**
 * Android channel for alarm reminders.
 * ⚠️ Android never changes a channel after it is created. If you change the
 * alarm sound or channel options, also change this id (e.g. `geo-alarms-v2`).
 */
export const ALARM_CHANNEL_ID = 'geo-alarms-v1';

/** Category that adds the "Stop" button to alarm notifications. */
export const ALARM_CATEGORY_ID = 'geonote-alarm';

/** Identifier of the "Stop" button. */
export const STOP_ALARM_ACTION_ID = 'stop-alarm';

/**
 * File name of the alarm sound. The file lives in `assets/sounds/` and is
 * bundled into the real build by the `expo-notifications` plugin in `app.config.ts`.
 * Expo Go cannot use bundled notification sounds, so there the default sound is used.
 */
const ALARM_SOUND_FILE = 'alarm.wav';

/** Data attached to every zone notification. */
export interface ZoneNotificationData extends Record<string, unknown> {
  /** Which zone fired (missing for test notifications). */
  zoneId?: string;
  alertStyle: AlertStyle;
  /** What happened: the user entered or left the zone. */
  trigger?: ZoneEvent;
}

/** The notification id used for a zone — lets us dismiss it later. */
export function notificationIdForZone(zoneId: string): string {
  return `zone-${zoneId}`;
}

/** Reads `alertStyle` from a received notification. */
export function getAlertStyle(notification: Notifications.Notification): AlertStyle {
  const data = notification.request.content.data as Partial<ZoneNotificationData> | undefined;
  return data?.alertStyle === 'alarm' ? 'alarm' : 'notification';
}

/**
 * How notifications behave while the app is **open**.
 * - zone reminder → in-app banner (components/InAppBanner) with sound
 * - test notification → system banner with sound
 * - alarm → no banner and no sound here, because the full-screen alarm
 *   (opened by the root layout) shows it and rings instead
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isAlarm = getAlertStyle(notification) === 'alarm';
      const data = notification.request.content.data as Partial<ZoneNotificationData> | undefined;
      // Zone reminders get the in-app banner (components/InAppBanner) instead of the system one.
      const isZoneReminder = typeof data?.zoneId === 'string';
      return {
        shouldShowBanner: !isAlarm && !isZoneReminder,
        shouldShowList: true,
        shouldPlaySound: !isAlarm,
        shouldSetBadge: false,
      };
    },
  });
}

/**
 * Which channels were created successfully.
 * `undefined` = not tried yet, `null` = failed (the default channel is used), string = channel id.
 */
const workingChannels: { notification?: string | null; alarm?: string | null; status?: string | null } = {};
/** True after the setup ran once. */
let setupDone = false;

/**
 * Creates one Android channel. Never throws: some phones (and Expo Go) reject
 * certain options, so if the full options fail we try only name + importance.
 * Returns the channel id, or `null` if even that failed.
 */
async function createChannel(
  id: string,
  fullOptions: Notifications.NotificationChannelInput,
): Promise<string | null> {
  try {
    await Notifications.setNotificationChannelAsync(id, fullOptions);
    return id;
  } catch (error) {
    console.warn(`[notifications] channel ${id}: full options rejected, trying simple ones`, error);
  }
  try {
    await Notifications.setNotificationChannelAsync(id, { name: fullOptions.name, importance: fullOptions.importance });
    return id;
  } catch (error) {
    console.warn(`[notifications] channel ${id} could not be created, using the default one`, error);
    return null;
  }
}

/**
 * Prepares everything notifications need. Safe to call many times (runs once).
 * - Android: the two channels (normal + alarm).
 * - Both platforms: the "Stop" button for alarms.
 */
export async function ensureNotificationChannel(): Promise<void> {
  if (setupDone) return;
  setupDone = true;

  const { language } = await getSettings();
  const t = getDictionary(language).notifications;

  if (Platform.OS === 'android') {
    workingChannels.notification = await createChannel(REMINDER_CHANNEL_ID, {
      name: t.channelName,
      description: t.channelDescription,
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 200, 250],
      lightColor: '#2563EB',
      lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    });

    workingChannels.alarm = await createChannel(ALARM_CHANNEL_ID, {
      name: t.alarmChannelName,
      description: t.alarmChannelDescription,
      importance: AndroidImportance.MAX,
      // In Expo Go the bundled sound does not exist, so keep the default sound there.
      sound: IS_EXPO_GO ? undefined : ALARM_SOUND_FILE,
      // "Alarm" usage: plays on the alarm volume, also when the ringer is silent.
      audioAttributes: { usage: AndroidAudioUsage.ALARM, contentType: AndroidAudioContentType.SONIFICATION },
      vibrationPattern: [0, 800, 600, 800, 600, 800, 600, 800],
      lightColor: '#F97316',
      lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    });

    // Quiet channel for "is the app working?" messages (features/health).
    workingChannels.status = await createChannel(STATUS_CHANNEL_ID, {
      name: t.statusChannelName,
      description: t.statusChannelDescription,
      importance: AndroidImportance.DEFAULT,
    });
  }

  try {
    await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
      { identifier: STOP_ALARM_ACTION_ID, buttonTitle: t.stopAction, options: { opensAppToForeground: true } },
    ]);
  } catch (error) {
    console.warn('[notifications] alarm category could not be created', error);
  }
}

/** "Show now" trigger. On Android it goes through the right channel when it exists. */
function showNowTrigger(alertStyle: AlertStyle): Notifications.NotificationTriggerInput {
  if (Platform.OS !== 'android') return null;
  const channelId = alertStyle === 'alarm' ? workingChannels.alarm : workingChannels.notification;
  return channelId ? { channelId } : null;
}

/** Content fields that differ between a normal notification and an alarm. */
function styleContent(alertStyle: AlertStyle): Partial<Notifications.NotificationContentInput> {
  if (alertStyle === 'notification') return { sound: 'default' };
  return {
    sound: IS_EXPO_GO ? 'default' : ALARM_SOUND_FILE, // iOS uses this; Android uses the channel
    categoryIdentifier: ALARM_CATEGORY_ID, // adds the "Stop" button
    sticky: true, // Android: cannot be swiped away — press Stop or tap it
    priority: AndroidNotificationPriority.MAX,
  };
}

/**
 * Builds the notification title and text, e.g.:
 * ```
 * Kalenić pijaca is near 👋
 * You're here! 3 things from your list are waiting for you.
 * • fresh vegetables
 * • coffee
 * ```
 */
async function buildZoneMessage(zone: Zone, event: ZoneEvent): Promise<{ title: string; body: string }> {
  const { language } = await getSettings();
  const t = getDictionary(language).notifications;

  const title = event === 'enter' ? t.arrivedTitle(zone.name) : t.leavingTitle(zone.name);
  const lines: string[] = [];

  if (zone.contentMode === 'list' && zone.checklist.length > 0) {
    // Items still to do. If the list resets on every visit, all items count.
    const openItems = zone.checklist.filter((item) => zone.resetChecklistOnTrigger || !item.done);
    lines.push(openItems.length > 0 ? t.itemsWaiting(openItems.length) : t.listDone);
    for (const item of openItems.slice(0, 5)) lines.push(`• ${item.text}`);
    if (openItems.length > 5) lines.push(t.andMore(openItems.length - 5));
  } else if (zone.note.trim()) {
    lines.push(zone.note.trim());
  } else {
    lines.push(event === 'enter' ? t.youAreHere : t.youAreLeaving);
  }

  return { title, body: lines.join('\n') };
}

/**
 * Shows the notification (or alarm) for one zone, immediately.
 *
 * @param event What happened (for trigger "both" this decides "is near" vs "leaving").
 */
export async function showZoneNotification(zone: Zone, event: ZoneEvent): Promise<void> {
  await ensureNotificationChannel();
  const { title, body } = await buildZoneMessage(zone, event);
  const data: ZoneNotificationData = { zoneId: zone.id, alertStyle: zone.alertStyle, trigger: event };
  await Notifications.scheduleNotificationAsync({
    identifier: notificationIdForZone(zone.id),
    content: { title, body, data, ...styleContent(zone.alertStyle) },
    trigger: showNowTrigger(zone.alertStyle),
  });
}

/** "Remind me in 15 min": shows the same notification again after `minutes`. */
export async function snoozeZoneNotification(zone: Zone, minutes = 15, event: ZoneEvent = 'enter'): Promise<void> {
  await ensureNotificationChannel();
  const { title, body } = await buildZoneMessage(zone, event);
  const data: ZoneNotificationData = { zoneId: zone.id, alertStyle: zone.alertStyle, trigger: event };
  const channelTrigger = showNowTrigger(zone.alertStyle);
  await Notifications.scheduleNotificationAsync({
    identifier: `${notificationIdForZone(zone.id)}-snooze`,
    content: { title, body, data, ...styleContent(zone.alertStyle) },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      ...(channelTrigger && 'channelId' in channelTrigger ? { channelId: channelTrigger.channelId } : {}),
    },
  });
}

/** Shows a test notification or test alarm (Settings → Location tracking). */
export async function showTestNotification(alertStyle: AlertStyle = 'notification'): Promise<void> {
  await ensureNotificationChannel();
  const { language } = await getSettings();
  const t = getDictionary(language).notifications;
  const isAlarm = alertStyle === 'alarm';
  const data: ZoneNotificationData = { alertStyle };
  await Notifications.scheduleNotificationAsync({
    identifier: isAlarm ? 'test-alarm' : 'test-notification',
    content: {
      title: isAlarm ? t.testAlarmTitle : t.testTitle,
      body: isAlarm ? t.testAlarmBody : t.testBody,
      data,
      ...styleContent(alertStyle),
    },
    trigger: showNowTrigger(alertStyle),
  });
}

/** Data of an app-status notification (tap → Location & notifications screen). */
export interface StatusNotificationData extends Record<string, unknown> {
  type: 'health';
  alertStyle: 'notification';
}

/**
 * Shows an **app-status** message ("Reminders may not pop up: …"), now or at `at`.
 * Uses the quiet status channel. The same `id` replaces the previous message.
 */
export async function showStatusNotification(id: string, title: string, body: string, at?: Date): Promise<void> {
  await ensureNotificationChannel();
  const data: StatusNotificationData = { type: 'health', alertStyle: 'notification' };
  const channel = Platform.OS === 'android' && workingChannels.status ? { channelId: workingChannels.status } : {};
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, data },
    trigger: at
      ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, ...channel }
      : Platform.OS === 'android' && workingChannels.status
        ? { channelId: workingChannels.status }
        : null,
  });
}

/** Cancels a scheduled notification that has not been shown yet. */
export async function cancelScheduledNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // nothing scheduled
  }
}

/** Removes a shown notification (stops its sound on Android). */
export async function dismissNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationId);
  } catch {
    // already gone
  }
}
