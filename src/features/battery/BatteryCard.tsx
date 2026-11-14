/**
 * **Battery** card (Location & notifications screen).
 *
 * - Reliable mode on/off (permanent notification vs. battery saver).
 * - Blizu's battery use: Low / Medium / Higher, and why (GPS mode).
 * - Location checks in the last 24 h and the phone's battery drop per hour.
 * - Button to the phone's own battery usage screen (the exact numbers).
 *
 * @module features/battery/BatteryCard
 * @category Feature: Battery
 */
import * as Battery from 'expo-battery';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, View } from 'react-native';

import { AppText, Button, Card, Divider, IconTile, Pill, SwitchRow, type IconName } from '@/components/ui';
import { trackerProfile } from '@/geo/backgroundTracker';
import { openAppSettings } from '@/geo/permissions';
import { useT } from '@/i18n/useT';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';
import { IS_EXPO_GO } from '@/utils/runtime';

import { readBatteryLog, sampleBattery, summarize, type BatterySummary } from './batteryLog';

/** Opens the phone's battery usage screen (Android), else the app settings. */
async function openSystemBatteryUsage(): Promise<void> {
  if (Platform.OS !== 'android') return openAppSettings();
  try {
    await Linking.sendIntent('android.intent.action.POWER_USAGE_SUMMARY');
  } catch {
    await openAppSettings();
  }
}

export function BatteryCard() {
  const t = useT();
  const zones = useAppStore((state) => state.zones);
  const trackingMode = useAppStore((state) => state.settings.trackingMode);
  const setTrackingMode = useAppStore((state) => state.setTrackingMode);
  const [summary, setSummary] = useState<BatterySummary | null>(null);
  const [power, setPower] = useState<{ percent: number; charging: boolean } | null>(null);

  // Read the log every time the screen is shown.
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      void sampleBattery()
        .then(readBatteryLog)
        .then((log) => {
          if (mounted) setSummary(summarize(log));
        });
      void Battery.getPowerStateAsync()
        .then((state) => {
          if (!mounted || state.batteryLevel < 0) return;
          const charging = state.batteryState === Battery.BatteryState.CHARGING || state.batteryState === Battery.BatteryState.FULL;
          setPower({ percent: Math.round(state.batteryLevel * 100), charging });
        })
        .catch(() => undefined);
      return () => {
        mounted = false;
      };
    }, []),
  );

  // How much battery Blizu itself uses, from the GPS mode.
  const activeZones = zones.filter((zone) => zone.active);
  const reliable = Platform.OS === 'android' && !IS_EXPO_GO && trackingMode === 'reliable' && activeZones.length > 0;
  const profile = reliable ? trackerProfile(activeZones).accuracy : 'saver';
  const usage = profile === 'precise' ? 'higher' : profile === 'balanced' ? 'medium' : 'low';
  const usageTone = usage === 'higher' ? 'warning' : usage === 'medium' ? 'primary' : 'success';
  const icon: IconName = usage === 'higher' ? 'battery-half-outline' : 'battery-full-outline';


  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <IconTile name={icon} tone={usageTone} size={44} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="headline">{t.battery.title}</AppText>
          {power ? (
            <AppText variant="caption" color="textSecondary">
              {t.battery.level(power.percent)}
              {power.charging ? ` · ${t.battery.charging}` : ''}
            </AppText>
          ) : null}
        </View>
      </View>

      {/* Reliable mode */}
      {Platform.OS === 'android' ? (
        <SwitchRow
          label={t.battery.modeTitle}
          hint={`${trackingMode === 'reliable' ? t.battery.modeReliable : t.battery.modeSaver}\n${t.battery.modeHint}`}
          value={trackingMode === 'reliable'}
          onChange={(on) => void setTrackingMode(on ? 'reliable' : 'saver')}
        />
      ) : (
        <AppText variant="caption" color="textSecondary">
          {t.battery.androidOnly}
        </AppText>
      )}

      <Divider />

      {/* Blizu's own use */}
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
          <AppText variant="body" style={{ fontWeight: '600', flex: 1 }}>
            {t.battery.usageLabel}
          </AppText>
          <Pill label={t.battery.usage[usage]} tone={usageTone} />
        </View>
        <AppText variant="caption" color="textSecondary">
          {t.battery.usageWhy[profile]}
        </AppText>
        {summary ? (
          <>
            <AppText variant="caption" color="textSecondary">
              {t.battery.positions24h(summary.positions24h)}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {summary.drainPerHour !== null
                ? t.battery.drain(summary.drainPerHour.toFixed(1), summary.measuredHours.toFixed(0))
                : t.battery.drainUnknown}
            </AppText>
          </>
        ) : null}
      </View>

      <AppText variant="caption" color="textTertiary">
        {t.battery.exactNote}
      </AppText>
      <Button title={t.battery.openSystem} icon="stats-chart-outline" variant="soft" size="small" onPress={() => void openSystemBatteryUsage()} />
    </Card>
  );
}
