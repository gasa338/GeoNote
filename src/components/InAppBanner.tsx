/**
 * @module components/InAppBanner
 * @category App components
 */
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getZoneById } from '@/data/zones';
import { useT } from '@/i18n/useT';
import {
  dismissNotification,
  getAlertStyle,
  snoozeZoneNotification,
  type ZoneNotificationData,
} from '@/notifications/notifications';
import { radius, spacing, useTheme } from '@/theme';

import { AppText, Icon } from './ui';

/** What the banner shows. */
interface BannerContent {
  zoneId: string;
  notificationId: string;
  title: string;
  body: string;
  entered: boolean;
}

/** How long the banner stays (ms). */
const VISIBLE_MS = 12000;

/**
 * The banner from the design ("Kalenić pijaca je GeoNote 👋") that slides in at
 * the top **while the app is open**, instead of the system notification.
 *
 * - "Open list" → zone details.
 * - "In 15 min" → the same reminder again in 15 minutes.
 *
 * Alarms are not shown here (they open the full-screen alarm instead).
 * Mounted once in the root layout.
 */
export function InAppBanner() {
  const t = useT();
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState<BannerContent | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      if (getAlertStyle(notification) === 'alarm') return;
      const data = notification.request.content.data as Partial<ZoneNotificationData> | undefined;
      if (!data?.zoneId) return; // test notifications use the normal system banner
      const title = notification.request.content.title ?? '';
      const body = notification.request.content.body ?? '';
      setMessage(null);
      setContent({
        zoneId: data.zoneId,
        notificationId: notification.request.identifier,
        title,
        body: body.split('\n')[0] ?? '',
        entered: data.trigger !== 'exit',
      });
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setContent(null), VISIBLE_MS);
    });
    return () => {
      subscription.remove();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!content) return null;

  function close() {
    setContent(null);
  }

  async function openList() {
    if (!content) return;
    await dismissNotification(content.notificationId);
    close();
    router.push({ pathname: '/zones/[id]', params: { id: content.zoneId } });
  }

  async function snooze() {
    if (!content) return;
    const zone = await getZoneById(content.zoneId);
    await dismissNotification(content.notificationId);
    if (zone) await snoozeZoneNotification(zone, 15, content.entered ? 'enter' : 'exit');
    setMessage(t.banner.snoozed);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(close, 2500);
  }

  return (
    <View style={[styles.wrapper, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.floating]}>
        <View style={styles.topRow}>
          <Icon name="location-outline" size={16} color="primary" />
          <AppText variant="overline" color="textSecondary" style={{ flex: 1, fontSize: 11 }}>
            {content.entered ? t.banner.entered : t.banner.left}
          </AppText>
          <AppText variant="caption" color="textTertiary">
            {t.banner.now}
          </AppText>
          <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel={t.story.close}>
            <Icon name="close" size={18} color="textTertiary" />
          </Pressable>
        </View>
        <AppText variant="title" style={{ fontSize: 18 }}>
          {content.title}
        </AppText>
        <AppText variant="body" color="textSecondary" numberOfLines={2}>
          {message ?? content.body}
        </AppText>
        {!message ? (
          <View style={styles.actions}>
            <Pressable onPress={() => void openList()} hitSlop={8} accessibilityRole="button">
              <AppText variant="button" color="primary" style={{ fontSize: 15 }}>
                {t.banner.openList} →
              </AppText>
            </Pressable>
            <Pressable onPress={() => void snooze()} hitSlop={8} accessibilityRole="button">
              <AppText variant="button" color="textSecondary" style={{ fontSize: 15, fontWeight: '500' }}>
                {t.banner.snooze}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: spacing.lg, right: spacing.lg, zIndex: 100 },
  card: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth * 2, padding: spacing.lg, gap: spacing.xs },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.sm },
});
