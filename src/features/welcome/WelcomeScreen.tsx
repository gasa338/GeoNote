/**
 * **Welcome** screen — shown once, on the very first start.
 *
 * Explains the app in three short points, lets the user pick a language,
 * then asks for notifications and location ("while using").
 * The "all the time" location permission is asked later, from the Home status
 * card or Settings, because on Android it opens the system settings and would
 * be confusing as a first step.
 *
 * @module features/welcome/WelcomeScreen
 * @category Feature: Welcome
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import { AppText, Button, IconTile, SegmentedControl, type IconName, type IconTileTone } from '@/components/ui';
import type { Language } from '@/data/types';
import { requestForegroundLocation, requestNotifications } from '@/geo/permissions';
import { getDictionary, LANGUAGES } from '@/i18n/dictionaries';
import { useLanguage, useT } from '@/i18n/useT';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';

/** Icon and color for each of the three feature points (same order as the texts). */
const FEATURE_ICONS: { icon: IconName; tone: IconTileTone }[] = [
  { icon: 'scan-outline', tone: 'primary' },
  { icon: 'checkbox-outline', tone: 'primary' },
  { icon: 'notifications-outline', tone: 'primary' },
];

export default function WelcomeScreen() {
  const t = useT();
  const language = useLanguage();
  const insets = useSafeAreaInsets();
  const setLanguage = useAppStore((state) => state.setLanguage);
  const finishOnboarding = useAppStore((state) => state.finishOnboarding);
  const syncGeofences = useAppStore((state) => state.syncGeofences);
  const [busy, setBusy] = useState(false);

  async function getStarted() {
    setBusy(true);
    try {
      await requestNotifications();
      await requestForegroundLocation();
    } catch (error) {
      console.warn('[welcome] permission request failed', error);
    }
    await finishOnboarding();
    void syncGeofences();
    setBusy(false);
    router.replace('/');
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Language first, so the user can read the rest in their language. */}
        <View style={{ alignSelf: 'flex-end', width: 200 }}>
          <SegmentedControl
            value={language}
            options={LANGUAGES.map((code) => ({ value: code, label: getDictionary(code).languageName }))}
            onChange={(value) => void setLanguage(value as Language)}
          />
        </View>

        <View style={{ gap: spacing.xl }}>
          <Logo size={44} />
          <View style={{ gap: spacing.md }}>
            <AppText variant="display">{t.welcome.title}</AppText>
            <AppText variant="body" color="textSecondary">
              {t.welcome.subtitle}
            </AppText>
          </View>
        </View>

        <View style={{ gap: spacing.xl }}>
          {t.welcome.features.map((feature, index) => (
            <View key={feature.title} style={styles.feature}>
              <IconTile name={FEATURE_ICONS[index].icon} tone={FEATURE_ICONS[index].tone} size={48} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="headline">{feature.title}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {feature.text}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppText variant="caption" color="textSecondary" center>
          {t.welcome.permissionsNote}
        </AppText>
        <Button title={t.welcome.getStarted} icon="arrow-forward" loading={busy} onPress={() => void getStarted()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xxxl,
  },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  footer: { paddingHorizontal: spacing.screen, gap: spacing.md },
});
