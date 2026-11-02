/**
 * App settings: language, theme, accent color, bottom tab bar, welcome flag.
 *
 * Stored as one small JSON object in AsyncStorage. The background task also
 * reads the language from here, so notifications use the right language even
 * when the app is closed.
 *
 * @module data/settings
 * @category Data
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppSettings, FeatureId } from './types';

/** AsyncStorage key that holds the settings object. */
export const SETTINGS_STORAGE_KEY = 'geonote:settings:v1';

/** Tab bar of the design: Map · My zones (· More). */
export const DEFAULT_TAB_BAR: FeatureId[] = ['map', 'zones'];

/** Settings used on the very first start. English is the main language. */
export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  themeMode: 'system',
  accentColor: 'blue',
  tabBar: DEFAULT_TAB_BAR,
  onboardingDone: false,
};

/** Section ids from version 1.2 that were renamed or merged. */
const OLD_TAB_IDS: Record<string, FeatureId | null> = {
  reminders: 'map',
  culture: 'places',
  publicPlaces: 'places',
  offers: null,
};

/** Reads the settings, falling back to {@link DEFAULT_SETTINGS}. */
export async function getSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!json) return DEFAULT_SETTINGS;
    // Spread defaults first so fields added in later versions get a value.
    const settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(json) as Partial<AppSettings>) };

    // Upgrade tab ids from older versions ("reminders" → "map", …).
    const tabBar: FeatureId[] = [];
    for (const id of settings.tabBar as string[]) {
      const newId = id in OLD_TAB_IDS ? OLD_TAB_IDS[id] : (id as FeatureId);
      if (newId && !tabBar.includes(newId)) tabBar.push(newId);
    }
    if (!tabBar.includes('zones') && (settings.tabBar as string[]).includes('reminders')) tabBar.splice(1, 0, 'zones');
    return { ...settings, tabBar };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Saves some settings fields and returns the full, updated settings. */
export async function updateSettings(changes: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...changes };
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
