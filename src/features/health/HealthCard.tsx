/**
 * **"Is GeoNote working?"** card (top of Location & notifications).
 *
 * Shows the last check, the last background check, and every problem with a
 * "Fix" button that opens the right place (permission dialog, location
 * settings, battery settings…). Sleep periods and late reminders are listed
 * until the user taps "Got it".
 *
 * @module features/health/HealthCard
 * @category Feature: Health
 */
import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';

import { AppText, Button, Card, Divider, IconTile, type IconName } from '@/components/ui';
import {
  openAppSettings,
  requestBackgroundLocation,
  requestForegroundLocation,
  requestNotifications,
} from '@/geo/permissions';
import { formatDateTime } from '@/i18n/dictionaries';
import { useLanguage, useT } from '@/i18n/useT';
import { spacing } from '@/theme';
import { IS_EXPO_GO } from '@/utils/runtime';

import { dismissHealthHistory, runHealthCheck } from './healthCheck';
import type { HealthProblemId } from './healthState';
import { useHealth } from './useHealth';

/** Icon for each problem. */
const PROBLEM_ICONS: Record<HealthProblemId, IconName> = {
  'location-off': 'location-outline',
  'no-location': 'location-outline',
  'no-background': 'navigate-outline',
  'no-notifications': 'notifications-off-outline',
  'tracking-stopped': 'warning-outline',
  'background-restricted': 'hourglass-outline',
  'battery-optimized': 'battery-half-outline',
  'power-saver': 'battery-dead-outline',
  'was-asleep': 'moon-outline',
  'caught-late': 'time-outline',
};

/** Opens an Android settings screen; falls back to the app's own settings. */
async function openAndroidSettings(action: string): Promise<void> {
  if (Platform.OS !== 'android') return openAppSettings();
  try {
    await Linking.sendIntent(action);
  } catch {
    await openAppSettings();
  }
}

/** What "Fix" does for each problem. */
async function fixProblem(id: HealthProblemId): Promise<void> {
  switch (id) {
    case 'location-off':
      return openAndroidSettings('android.settings.LOCATION_SOURCE_SETTINGS');
    case 'no-location':
      if ((await requestForegroundLocation()) !== 'granted') await openAppSettings();
      return;
    case 'no-background':
      if ((await requestBackgroundLocation()) !== 'granted') await openAppSettings();
      return;
    case 'no-notifications':
      if ((await requestNotifications()) !== 'granted') await openAppSettings();
      return;
    case 'battery-optimized':
      return openAndroidSettings('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
    case 'power-saver':
      return openAndroidSettings('android.settings.BATTERY_SAVER_SETTINGS');
    default:
      return openAppSettings();
  }
}

export function HealthCard() {
  const t = useT();
  const language = useLanguage();
  const health = useHealth();
  const [checking, setChecking] = useState(false);

  async function checkAgain() {
    setChecking(true);
    try {
      await runHealthCheck('app');
    } finally {
      setChecking(false);
    }
  }

  async function fix(id: HealthProblemId) {
    if (id === 'was-asleep' || id === 'caught-late') return dismissHealthHistory();
    await fixProblem(id);
    await runHealthCheck('app');
  }

  const report = health?.report;
  const problems = report?.problems ?? [];
  const hasError = problems.some((problem) => problem.severity === 'error');
  const idle = report !== null && report !== undefined && report.activeZones === 0;

  const headline = idle ? t.health.idle : problems.length === 0 ? t.health.allGood : t.health.problemsFound(problems.length);
  const tone = idle ? 'neutral' : problems.length === 0 ? 'success' : hasError ? 'danger' : 'warning';
  const icon: IconName = problems.length === 0 ? 'shield-checkmark-outline' : 'alert-circle-outline';

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <IconTile name={icon} tone={tone} size={44} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="headline">{t.health.title}</AppText>
          <AppText variant="body" color={tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : tone === 'success' ? 'success' : 'textSecondary'}>
            {headline}
          </AppText>
        </View>
      </View>

      {problems.map((problem) => (
        <View key={problem.id} style={{ gap: spacing.sm }}>
          <Divider />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <IconTile name={PROBLEM_ICONS[problem.id]} tone={problem.severity === 'error' ? 'danger' : 'warning'} size={36} />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="body" style={{ fontWeight: '600' }}>
                {t.health.problems[problem.id].title}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {t.health.problems[problem.id].text}
              </AppText>
            </View>
            <Button
              title={problem.id === 'was-asleep' || problem.id === 'caught-late' ? t.health.seen : t.health.fix}
              size="small"
              variant={problem.severity === 'error' ? 'primary' : 'secondary'}
              onPress={() => void fix(problem.id)}
            />
          </View>
          {problem.id === 'was-asleep' && health?.lastGap ? (
            <AppText variant="caption" color="textSecondary" style={{ marginLeft: 48 }}>
              {formatDateTime(health.lastGap.from, language)} → {formatDateTime(health.lastGap.to, language)}
            </AppText>
          ) : null}
          {problem.id === 'caught-late'
            ? health?.lateCatches.slice(0, 5).map((item) => (
                <AppText key={item.at} variant="caption" color="textSecondary" style={{ marginLeft: 48 }}>
                  {t.health.lateItem(item.zoneName, formatDateTime(item.at, language))}
                </AppText>
              ))
            : null}
        </View>
      ))}

      <Divider />
      <View style={{ gap: 2 }}>
        {report ? (
          <AppText variant="caption" color="textTertiary">
            {t.health.lastCheck(formatDateTime(report.checkedAt, language))}
          </AppText>
        ) : null}
        <AppText variant="caption" color="textTertiary">
          {IS_EXPO_GO
            ? t.health.expoGo
            : health?.lastBackgroundCheckAt
              ? t.health.lastBackground(formatDateTime(health.lastBackgroundCheckAt, language))
              : t.health.noBackgroundYet}
        </AppText>
      </View>
      <Button title={t.health.checkNow} icon="refresh" variant="soft" size="small" loading={checking} onPress={() => void checkAgain()} />
    </Card>
  );
}
