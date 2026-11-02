/**
 * The **design system**: colors, spacing, corner radius, text styles, shadows.
 *
 * Change a value here and the whole app follows. Screens never use raw color
 * codes — they read them from `useTheme().colors`.
 *
 * - Look (light / dark / system) and the **accent color** are chosen by the
 *   user in Settings; `useTheme()` applies both.
 * - Calm neutrals (white sheets over a light map, navy text) keep the focus on
 *   the content; the accent color marks actions and the user's zones.
 *
 * @module theme
 * @category Design
 */
import { Platform, useColorScheme, type TextStyle, type ViewStyle } from 'react-native';

import type { AccentColor } from '@/data/types';
import { useAppStore } from '@/store/useAppStore';

/** Light mode neutrals. */
const lightColors = {
  /** Behind sheets (also the map placeholder color). */
  background: '#F3F5F8',
  /** Sheets, cards, inputs, tab bar. */
  surface: '#FFFFFF',
  /** Filled areas: segmented control, option groups, icon tiles. */
  surfaceMuted: '#F1F4F8',
  /** Hairlines and card borders. */
  border: '#E5E8EE',
  text: '#1A2233',
  textSecondary: '#5E6878',
  textTertiary: '#9AA3B2',
  primary: '#3370EA',
  primarySoft: '#EAF1FD',
  onPrimary: '#FFFFFF',
  accent: '#E07A2E',
  accentSoft: '#FDF0E6',
  success: '#2E9A5E',
  successSoft: '#E8F6EE',
  warning: '#B26A12',
  warningSoft: '#FDF3E2',
  danger: '#D93B3B',
  dangerSoft: '#FCEBEB',
};

/** The list of color names (same in light and dark mode). */
export type ThemeColors = typeof lightColors;

/** Dark mode neutrals (same names). */
const darkColors: ThemeColors = {
  background: '#0B111C',
  surface: '#151E2E',
  surfaceMuted: '#1D283B',
  border: '#27334A',
  text: '#EDF1F7',
  textSecondary: '#A5AFC0',
  textTertiary: '#6C788C',
  primary: '#6F9BFF',
  primarySoft: '#1C2B4A',
  onPrimary: '#FFFFFF',
  accent: '#F29A55',
  accentSoft: '#3A2716',
  success: '#55C38A',
  successSoft: '#15301F',
  warning: '#F0B24E',
  warningSoft: '#372A12',
  danger: '#F07272',
  dangerSoft: '#3A1919',
};

/**
 * Accent colors the user can choose (Settings → Accent color).
 * `light` / `dark` = the color in each look; `softLight` / `softDark` = its pale background.
 */
export const ACCENTS: Record<AccentColor, { light: string; dark: string; softLight: string; softDark: string }> = {
  blue: { light: '#3370EA', dark: '#6F9BFF', softLight: '#EAF1FD', softDark: '#1C2B4A' },
  purple: { light: '#7457D3', dark: '#A68FF2', softLight: '#F0ECFB', softDark: '#2A2347' },
  green: { light: '#2E8A6C', dark: '#5CC59F', softLight: '#E6F4EF', softDark: '#173229' },
  orange: { light: '#C97D2E', dark: '#F0AE62', softLight: '#FBF1E5', softDark: '#38291A' },
  pink: { light: '#C0577A', dark: '#EC8CAC', softLight: '#FAEBF0', softDark: '#3A1F2A' },
};

/** Spacing scale in points. Use these instead of random numbers. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
  /** Left/right padding of every screen. */
  screen: 22,
  /** Vertical gap between sections of a screen. */
  section: 24,
};

/** Corner radius scale. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  /** Top corners of a bottom sheet. */
  sheet: 28,
  pill: 999,
};

/** Text styles. Use them through `<AppText variant="…">`. */
export const typography = {
  /** Big screen title ("Više", "Kalenić pijaca"). */
  display: { fontSize: 30, lineHeight: 36, fontWeight: '500', letterSpacing: -0.4 },
  /** Section and card titles. */
  title: { fontSize: 21, lineHeight: 27, fontWeight: '600', letterSpacing: -0.2 },
  /** List item titles. */
  headline: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  /** Normal text. */
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  /** Small secondary text. */
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  /** Small uppercase labels ("TVOJ PROSTOR"). */
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  /** Button labels. */
  button: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
} satisfies Record<string, TextStyle>;

/** Names of the text styles above. */
export type TypographyVariant = keyof typeof typography;

/** Soft shadow for floating elements over the map. */
const floatingShadow: ViewStyle = Platform.select({
  ios: { shadowColor: '#0F172A', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  default: { elevation: 6 },
});

/** Very soft shadow for sheets. */
const sheetShadow: ViewStyle = Platform.select({
  ios: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: -4 } },
  default: { elevation: 10 },
});

/**
 * Returns the colors for the current look and accent, plus shadows.
 *
 * @example
 * ```tsx
 * const { colors } = useTheme();
 * <View style={{ backgroundColor: colors.surface }} />
 * ```
 */
export function useTheme() {
  const themeMode = useAppStore((state) => state.settings.themeMode);
  const accentColor = useAppStore((state) => state.settings.accentColor);
  const systemScheme = useColorScheme();
  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';

  const accent = ACCENTS[accentColor] ?? ACCENTS.blue;
  const base = isDark ? darkColors : lightColors;
  const colors: ThemeColors = {
    ...base,
    primary: isDark ? accent.dark : accent.light,
    primarySoft: isDark ? accent.softDark : accent.softLight,
  };

  return {
    colors,
    isDark,
    shadows: { card: {} as ViewStyle, floating: floatingShadow, sheet: sheetShadow },
  };
}
