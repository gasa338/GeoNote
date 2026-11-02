/**
 * **Settings** (design: "Podešavanja").
 *
 * 1. App look — Device / Light / Dark
 * 2. Accent color — five colors
 * 3. Language — English / Srpski
 * 4. Location & notifications → permissions, tracking, testing, activity log
 * 5. Organize navigation → which sections are in the bottom bar
 *
 * Route: `src/app/(tabs)/settings.tsx`.
 *
 * @module features/settings/SettingsScreen
 * @category Feature: Settings
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Divider, Icon, IconTile, SegmentedControl, type IconName } from '@/components/ui';
import type { AccentColor, Language, ThemeMode } from '@/data/types';
import { usePermissions } from '@/hooks/usePermissions';
import { getDictionary, LANGUAGES } from '@/i18n/dictionaries';
import { useLanguage, useT } from '@/i18n/useT';
import { isInTabBar } from '@/navigation/features';
import { useAppStore } from '@/store/useAppStore';
import { ACCENTS, radius, spacing, useTheme } from '@/theme';
import { APP_VERSION } from '@/utils/runtime';

/** The three look options, with their icons. */
const THEME_OPTIONS: { value: ThemeMode; icon: IconName }[] = [
  { value: 'system', icon: 'phone-portrait-outline' },
  { value: 'light', icon: 'sunny-outline' },
  { value: 'dark', icon: 'moon-outline' },
];

/** Accent colors in the order shown. */
const ACCENT_ORDER: AccentColor[] = ['blue', 'purple', 'green', 'orange', 'pink'];

export default function SettingsScreen() {
  const t = useT();
  const language = useLanguage();
  const { colors, isDark } = useTheme();
  const { permissions } = usePermissions();
  const settings = useAppStore((state) => state.settings);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setAccentColor = useAppStore((state) => state.setAccentColor);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const themeLabels: Record<ThemeMode, string> = { system: t.settings.device, light: t.settings.light, dark: t.settings.dark };

  // "Always allowed · notifications on"
  let locationText = t.settings.locationOff;
  if (permissions?.background === 'granted') locationText = t.settings.locationAlways;
  else if (permissions?.foreground === 'granted') locationText = t.settings.locationWhileUsing;
  const notificationText = permissions?.notifications === 'granted' ? t.settings.notificationsOn : t.settings.notificationsOff;

  return (
    <SheetScreen backLabel={isInTabBar(settings.tabBar, 'settings') ? undefined : t.more.back}>
      <AppText variant="display">{t.settings.title}</AppText>

      {/* 1. Look */}
      <View style={{ gap: spacing.md }}>
        <View style={styles.titleRow}>
          <AppText variant="headline" style={{ fontSize: 17 }}>
            {t.settings.appearance}
          </AppText>
          {settings.themeMode === 'system' ? (
            <AppText variant="caption" color="textSecondary">
              {t.settings.appearanceHint}
            </AppText>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {THEME_OPTIONS.map((option) => {
            const selected = settings.themeMode === option.value;
            const darkCard = option.value === 'dark';
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => void setThemeMode(option.value)}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: darkCard ? '#1E293B' : selected ? colors.primarySoft : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                    borderWidth: selected ? 2 : StyleSheet.hairlineWidth * 2,
                  },
                ]}>
                <Ionicon name={option.icon} color={darkCard ? '#FFFFFF' : selected ? colors.primary : colors.textSecondary} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppText
                    variant="button"
                    style={{ fontSize: 14, color: darkCard ? '#FFFFFF' : selected ? colors.primary : colors.text }}>
                    {themeLabels[option.value]}
                  </AppText>
                  {selected ? <Ionicon name="checkmark" size={14} color={darkCard ? '#FFFFFF' : colors.primary} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Accent color */}
      <View style={{ gap: spacing.md }}>
        <View style={styles.titleRow}>
          <AppText variant="headline" style={{ fontSize: 17 }}>
            {t.settings.accent}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {t.settings.accentNames[settings.accentColor]}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {ACCENT_ORDER.map((accent) => {
            const selected = settings.accentColor === accent;
            const color = isDark ? ACCENTS[accent].dark : ACCENTS[accent].light;
            return (
              <Pressable
                key={accent}
                accessibilityRole="radio"
                accessibilityLabel={t.settings.accentNames[accent]}
                accessibilityState={{ checked: selected }}
                onPress={() => void setAccentColor(accent)}
                style={[styles.swatchRing, { borderColor: selected ? color : 'transparent' }]}>
                <View style={[styles.swatch, { backgroundColor: color }]}>
                  {selected ? <Ionicon name="checkmark" size={18} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 3. Language */}
      <View style={{ gap: spacing.md }}>
        <AppText variant="headline" style={{ fontSize: 17 }}>
          {t.settings.language}
        </AppText>
        <SegmentedControl
          value={language}
          options={LANGUAGES.map((code) => ({ value: code, label: getDictionary(code).languageName }))}
          onChange={(value) => void setLanguage(value as Language)}
        />
      </View>

      {/* 4–5. Rows */}
      <View>
        <Pressable onPress={() => router.push('/permissions')} style={styles.row} accessibilityRole="button">
          <IconTile name="location-outline" color={colors.success} size={40} />
          <View style={{ flex: 1 }}>
            <AppText variant="headline">{t.settings.locationRow}</AppText>
            <AppText variant="caption" color="textSecondary">
              {locationText} · {notificationText}
            </AppText>
          </View>
          <Icon name="chevron-forward" size={20} color="textSecondary" />
        </Pressable>
        <Divider />
        <Pressable onPress={() => router.push('/navigation')} style={styles.row} accessibilityRole="button">
          <IconTile name="reorder-three-outline" size={40} />
          <View style={{ flex: 1 }}>
            <AppText variant="headline">{t.navigationEditor.title}</AppText>
            <AppText variant="caption" color="textSecondary">
              {t.settings.organizeHint}
            </AppText>
          </View>
          <Icon name="chevron-forward" size={20} color="textSecondary" />
        </Pressable>
      </View>

      <AppText variant="caption" color="textTertiary" style={{ fontSize: 12 }}>
        {t.settings.about(APP_VERSION)}
      </AppText>
    </SheetScreen>
  );
}

/** Icon with a raw color (the theme cards use colors outside the theme names). */
function Ionicon({ name, color, size = 22 }: { name: IconName; color: string; size?: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: 84, borderRadius: radius.lg },
  swatchRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, padding: 3 },
  swatch: { flex: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
});
