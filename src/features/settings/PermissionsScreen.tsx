/**
 * **Location & notifications** — everything needed to make reminders work,
 * and to find out why one did not pop up.
 *
 * 0. "Is GeoNote working?" — the app health card (`features/health/HealthCard`).
 * 1. Permissions (location, "all the time", notifications) + battery tip for
 *    phones that stop background apps (Xiaomi, Samsung, Huawei…).
 * 2. Tracking status, refresh, test notification, test alarm.
 * 3. Testing: "Arrive at …" for every active zone, live distance.
 * 4. Activity log — the reason behind every reminder that fired or was skipped.
 *
 * Route: `src/app/permissions.tsx`.
 *
 * @module features/settings/PermissionsScreen
 * @category Feature: Settings
 */
import * as Device from 'expo-device';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Button, Card, Divider, InfoRow, Notice, Pill, Section } from '@/components/ui';
import { addLogEntry, clearLog, readLog, type LogEntry } from '@/data/activityLog';
import type { AlertStyle } from '@/data/types';
import {
  openAppSettings,
  requestAllPermissions,
  requestBackgroundLocation,
  requestForegroundLocation,
  requestNotifications,
  type PermStatus,
} from '@/geo/permissions';
import { HealthCard } from '@/features/health/HealthCard';
import { handleGeofenceEvent } from '@/geo/reminderEngine';
import { usePermissions } from '@/hooks/usePermissions';
import { describeStatus } from '@/hooks/useTrackingStatus';
import { formatDateTime } from '@/i18n/dictionaries';
import { useLanguage, useT } from '@/i18n/useT';
import { showTestNotification } from '@/notifications/notifications';
import { useAppStore } from '@/store/useAppStore';
import { spacing, useTheme } from '@/theme';
import { IS_EXPO_GO } from '@/utils/runtime';

import { LiveDistances } from './components/LiveDistances';

/** Phone brands known to stop background apps aggressively. */
const STRICT_BATTERY_BRANDS = ['xiaomi', 'redmi', 'poco', 'huawei', 'honor', 'samsung', 'oppo', 'vivo', 'oneplus', 'realme'];

export default function PermissionsScreen() {
  const t = useT();
  const language = useLanguage();
  const { colors } = useTheme();
  const { permissions, refresh: refreshPermissions } = usePermissions();
  const zones = useAppStore((state) => state.zones);
  const geofence = useAppStore((state) => state.geofence);
  const syncGeofences = useAppStore((state) => state.syncGeofences);
  const reload = useAppStore((state) => state.reload);
  const [refreshing, setRefreshing] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  const activeZones = zones.filter((zone) => zone.active);
  const brand = Device.manufacturer ?? '';
  const strictBattery = STRICT_BATTERY_BRANDS.includes(brand.toLowerCase());

  const loadLog = useCallback(() => {
    void readLog().then(setLog);
  }, []);
  useFocusEffect(loadLog);

  // ---- Actions ---------------------------------------------------------------

  async function afterPermissionChange() {
    await refreshPermissions();
    await syncGeofences();
    loadLog();
  }

  /** If a permission was denied before, the system will not ask again — open settings instead. */
  async function askOrOpenSettings(ask: () => Promise<PermStatus>) {
    const result = await ask();
    if (result !== 'granted') await openAppSettings();
    await afterPermissionChange();
  }

  async function askForBackground() {
    const result = await requestBackgroundLocation();
    if (result !== 'granted') {
      Alert.alert(t.permissions.alwaysAlertTitle, t.permissions.alwaysAlertText, [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.common.openSettings, onPress: () => void openAppSettings() },
      ]);
    }
    await afterPermissionChange();
  }

  async function sendTest(alertStyle: AlertStyle) {
    try {
      await showTestNotification(alertStyle);
      void addLogEntry('fired', `Test ${alertStyle} sent.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void addLogEntry('error', `Test ${alertStyle} failed: ${message}`);
      Alert.alert(t.permissions.testFailedTitle, message);
    }
    loadLog();
  }

  async function simulateArrival(zoneId: string) {
    await handleGeofenceEvent(zoneId, 'enter', 'test');
    await reload();
    loadLog();
  }

  /** Right side of a permission row: green "Allowed" or an "Allow" button. */
  function permissionAction(status: PermStatus | undefined, onPress: () => void) {
    if (status === 'granted') return <Pill tone="success" icon="checkmark" label={t.common.allowed} />;
    return <Button title={t.common.allow} size="small" onPress={onPress} />;
  }

  const status = permissions ? describeStatus(permissions, geofence, t.status) : null;
  const logColors = { fired: colors.success, skipped: colors.warning, info: colors.textTertiary, error: colors.danger };

  return (
    <SheetScreen backLabel={t.features.settings.title} headerRight={null}>
      <AppText variant="display">{t.permissions.title}</AppText>

      {/* 0. Is GeoNote working? */}
      <HealthCard />

      {/* 1. Permissions */}
      <Section title={t.permissions.sectionPermissions}>
        {permissions && !permissions.locationServicesOn ? <Notice tone="warning" text={t.permissions.locationServicesOff} /> : null}
        <Card style={{ gap: spacing.md }}>
          <InfoRow
            icon="location-outline"
            iconTone="primary"
            title={t.permissions.location}
            subtitle={t.permissions.locationHint}
            right={permissionAction(permissions?.foreground, () => void askOrOpenSettings(requestForegroundLocation))}
          />
          {!IS_EXPO_GO ? (
            <>
              <Divider />
              <InfoRow
                icon="navigate-outline"
                iconTone="primary"
                title={t.permissions.always}
                subtitle={t.permissions.alwaysHint}
                right={permissionAction(permissions?.background, () => void askForBackground())}
              />
            </>
          ) : null}
          <Divider />
          <InfoRow
            icon="notifications-outline"
            iconTone="primary"
            title={t.permissions.notifications}
            subtitle={t.permissions.notificationsHint}
            right={permissionAction(permissions?.notifications, () => void askOrOpenSettings(requestNotifications))}
          />
        </Card>
        <Button
          title={t.permissions.requestAll}
          variant="soft"
          icon="shield-checkmark-outline"
          onPress={() => void requestAllPermissions().then(afterPermissionChange)}
        />
        {strictBattery && !IS_EXPO_GO ? (
          <Card style={{ gap: spacing.sm, backgroundColor: colors.warningSoft, borderColor: colors.warningSoft }}>
            <AppText variant="headline" color="warning">
              {t.permissions.batteryTitle(brand)}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {t.permissions.batteryText}
            </AppText>
            <Button title={t.common.openSettings} size="small" variant="secondary" onPress={() => void openAppSettings()} />
          </Card>
        ) : null}
      </Section>

      {/* 2. Tracking */}
      <Section title={t.permissions.sectionTracking}>
        <Card style={{ gap: spacing.md }}>
          {status ? (
            <InfoRow
              icon={status.icon}
              iconTone={status.ok ? 'success' : 'warning'}
              title={geofence?.state === 'active' ? t.status.watching(geofence.total) : status.ok ? t.status.idle : status.text}
              subtitle={status.ok ? status.text : geofence?.error}
            />
          ) : null}
          <AppText variant="caption" color="textSecondary">
            {IS_EXPO_GO ? t.permissions.testMode : t.permissions.backgroundDelay}
          </AppText>
          {geofence?.usesRefreshRegion ? (
            <AppText variant="caption" color="textSecondary">
              {t.permissions.refreshRegionHint}
            </AppText>
          ) : null}
          {geofence?.updatedAt ? (
            <AppText variant="caption" color="textTertiary">
              {t.permissions.lastRefresh(formatDateTime(geofence.updatedAt, language))}
            </AppText>
          ) : null}
          <Button
            title={t.permissions.refresh}
            variant="secondary"
            icon="refresh-outline"
            loading={refreshing}
            onPress={async () => {
              setRefreshing(true);
              await syncGeofences();
              setRefreshing(false);
              loadLog();
            }}
          />
          <Button title={t.permissions.testNotification} variant="ghost" icon="paper-plane-outline" onPress={() => void sendTest('notification')} />
          <Button title={t.permissions.testAlarm} variant="ghost" icon="alarm-outline" onPress={() => void sendTest('alarm')} />
        </Card>
      </Section>

      {/* 3. Testing */}
      {activeZones.length > 0 ? (
        <Section title={t.permissions.sectionTesting} description={t.permissions.testingHint}>
          {activeZones.map((zone) => (
            <Button
              key={zone.id}
              title={t.permissions.simulateArrival(zone.name)}
              variant="secondary"
              icon="enter-outline"
              onPress={() => void simulateArrival(zone.id)}
            />
          ))}
          <Card style={{ gap: spacing.md }}>
            <AppText variant="headline">{t.permissions.liveDistance}</AppText>
            <LiveDistances zones={activeZones} />
          </Card>
        </Section>
      ) : null}

      {/* 4. Activity log */}
      <Section
        title={t.permissions.sectionLog}
        description={t.permissions.logHint}
        right={
          log.length > 0 ? (
            <Pressable onPress={() => void clearLog().then(loadLog)} hitSlop={8} accessibilityRole="button">
              <AppText variant="caption" color="primary" style={{ fontWeight: '600' }}>
                {t.permissions.clearLog}
              </AppText>
            </Pressable>
          ) : undefined
        }>
        <Card style={{ gap: spacing.sm }}>
          {log.length === 0 ? (
            <AppText variant="caption" color="textSecondary">
              {t.permissions.logEmpty}
            </AppText>
          ) : (
            log.map((entry, index) => (
              <View key={`${entry.time}-${index}`} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: logColors[entry.kind] }} />
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" color="textTertiary" style={{ fontSize: 11 }}>
                    {formatDateTime(entry.time, language)}
                  </AppText>
                  <AppText variant="caption">{entry.message}</AppText>
                </View>
              </View>
            ))
          )}
        </Card>
      </Section>
    </SheetScreen>
  );
}
