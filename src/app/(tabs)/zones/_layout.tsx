/**
 * Stack inside the "My zones" tab: the list, and its detail screen on top of it.
 * Keeping both in the tab means the tab bar stays visible on the detail screen.
 *
 * @module app/(tabs)/zones/_layout
 * @category Navigation
 */
import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/**
 * The list is always under the detail screen, so "back" from a detail screen
 * lands on the list (unless the screen was opened with `?from=…`, see SheetScreen).
 */
export const unstable_settings = { initialRouteName: 'index' };

export default function ZonesStackLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
