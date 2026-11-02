/**
 * **Alarm** screen — full screen, rings until the user presses "Stop alarm".
 *
 * Opened automatically by the root layout when an alarm zone fires while
 * the app is open. Params: `id` = zone id (or `test`), `event` = `enter`/`exit`.
 *
 * Buttons: **Stop** · **Snooze** (rings again in `ALARM_CONFIG.snoozeMinutes`) · Open zone.
 * The sound loops and the phone vibrates (`alarmSound.ts`). Ringing stops when
 * the user presses a button, leaves the screen, or after `ALARM_CONFIG.maxDurationMs`.
 * All settings: `alarmConfig.ts`.
 *
 * @module features/alarm/AlarmScreen
 * @category Feature: Alarm
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { dismissNotification, notificationIdForZone, snoozeZoneNotification } from '@/notifications/notifications';
import { useZone } from '@/store/useAppStore';
import { radius, spacing } from '@/theme';

import { ALARM_CONFIG } from './alarmConfig';
import { startAlarmSound, stopAlarmSound } from './alarmSound';

/** Alarm background — the same strong orange in light and dark mode, so white text stays readable. */
const ALARM_COLOR = ALARM_CONFIG.color;

export default function AlarmScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { id, event: eventParam } = useLocalSearchParams<{ id: string; event?: string }>();
  const isTest = id === 'test';
  const event = eventParam === 'exit' ? 'exit' : 'enter';

  const zone = useZone(isTest ? undefined : id);

  // Ring while this screen is visible.
  useEffect(() => {
    void startAlarmSound();
    return () => stopAlarmSound();
  }, []);

  /** Stops the sound and removes the notification from the notification bar. */
  async function silence() {
    stopAlarmSound();
    await dismissNotification(isTest ? 'test-alarm' : notificationIdForZone(id));
    if (!isTest) await dismissNotification(`${notificationIdForZone(id)}-snooze`);
  }

  async function stop() {
    await silence();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  /** Silence now, ring again in a few minutes. */
  async function snooze() {
    await silence();
    if (zone) await snoozeZoneNotification(zone, ALARM_CONFIG.snoozeMinutes, event);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function openZone() {
    await silence();
    router.replace({ pathname: '/zones/[id]', params: { id } });
  }

  // Texts: the zone, or the test alarm.
  const title = isTest ? t.notifications.testAlarmTitle : (zone?.name ?? t.alarm.label);
  const placeLine = zone
    ? event === 'exit'
      ? t.notifications.leavingTitle(zone.name)
      : t.notifications.youAreHere
    : null;
  const openItems = zone && zone.contentMode === 'list' ? zone.checklist.filter((item) => zone.resetChecklistOnTrigger || !item.done) : [];

  return (
    <View style={[styles.screen, { backgroundColor: ALARM_COLOR, paddingTop: insets.top + spacing.xxl }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Big ringing icon */}
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Ionicons name="alarm" size={64} color={ALARM_COLOR} />
          </View>
        </View>

        <View style={{ gap: spacing.sm, alignItems: 'center' }}>
          <AppText variant="overline" style={styles.whiteSoft}>
            {t.alarm.label}
          </AppText>
          <AppText variant="display" center style={styles.white}>
            {title}
          </AppText>
          {placeLine ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Icon name="location" size={18} color="onPrimary" />
              <AppText variant="body" style={styles.white}>
                {placeLine}
              </AppText>
            </View>
          ) : null}
        </View>

        {zone?.note && zone.contentMode === 'note' ? (
          <AppText variant="body" center style={styles.whiteSoft}>
            {zone.note}
          </AppText>
        ) : null}

        {openItems.length > 0 ? (
          <View style={styles.listBox}>
            <AppText variant="overline" style={styles.whiteSoft}>
              {t.alarm.stillToDo}
            </AppText>
            {openItems.slice(0, 8).map((item) => (
              <AppText key={item.id} variant="headline" style={styles.white}>
                • {item.text}
              </AppText>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md }]}>
        {/* Big white "Stop" button — the main action, easy to hit. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.alarm.stop}
          onPress={() => void stop()}
          style={({ pressed }) => [styles.stopButton, { opacity: pressed ? 0.85 : 1 }]}>
          <Ionicons name="stop-circle" size={28} color={ALARM_COLOR} />
          <AppText variant="title" style={{ fontSize: 22, color: ALARM_COLOR }}>
            {t.alarm.stop}
          </AppText>
        </Pressable>
        {!isTest && zone ? (
          <View style={styles.secondaryRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void snooze()}
              style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              <AppText variant="button" style={styles.white}>
                {t.alarm.snooze(ALARM_CONFIG.snoozeMinutes)}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void openZone()}
              style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name="list-outline" size={20} color="#FFFFFF" />
              <AppText variant="button" style={styles.white}>
                {t.alarm.openZone}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignItems: 'center', gap: spacing.xxl, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl },
  iconOuter: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  white: { color: '#FFFFFF' },
  whiteSoft: { color: 'rgba(255,255,255,0.85)' },
  listBox: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  actions: { paddingHorizontal: spacing.screen, gap: spacing.md },
  stopButton: {
    minHeight: 72,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  secondaryRow: { flexDirection: 'row', gap: spacing.md },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
