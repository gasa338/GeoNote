/**
 * @module theme/applyThemeMode
 * @category Design
 */
import { Appearance } from 'react-native';

import type { ThemeMode } from '@/data/types';

/**
 * Tells the system which look to use, so native parts (keyboard, alerts,
 * switches, the map) match the app. Called when settings load and when the
 * user changes the theme in Settings.
 *
 * The app's own colors come from `useTheme()`, which reads the same setting.
 */
export function applyThemeMode(mode: ThemeMode): void {
  try {
    Appearance.setColorScheme(mode === 'system' ? 'auto' : mode);
  } catch {
    // Not supported on this platform — the app colors still follow the setting.
  }
}
