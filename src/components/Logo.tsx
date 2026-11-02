/**
 * The app logo: a pin + the word "GeoNote" (as in the design).
 *
 * ### Replacing it with your own logo file
 * 1. Save the logo as `assets/images/logo.png` (transparent background).
 * 2. In {@link Logo} below, set `USE_IMAGE_LOGO = true`.
 * Every screen uses this component, so the new logo appears everywhere.
 *
 * The icon on the phone's home screen is separate: replace
 * `assets/images/icon.png` (1024 × 1024) and the `android-icon-*.png` files,
 * then make a new build.
 *
 * @module components/Logo
 * @category App components
 */
import { Image, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText, Icon } from './ui';

/** The app name. Change it here if the name changes (the phone label is in `app.config.ts`). */
export const APP_NAME = 'GeoNote';

/** `true` = show `assets/images/logo.png` instead of the drawn wordmark. */
const USE_IMAGE_LOGO = false;

/** Props of {@link Logo}. */
export interface LogoProps {
  /** Height of the logo in points. Default 32. */
  size?: number;
}

/** The logo. */
export function Logo({ size = 32 }: LogoProps) {
  if (USE_IMAGE_LOGO) {
    return (
      <Image
        source={require('../../assets/images/logo.png')}
        style={{ height: size, width: size * 3, resizeMode: 'contain' }}
        accessibilityLabel={APP_NAME}
      />
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }} accessibilityLabel={APP_NAME} accessible>
      <Icon name="location-outline" size={size * 0.85} color="primary" />
      <AppText style={{ fontSize: size, lineHeight: size * 1.2, fontWeight: '400', letterSpacing: -0.5 }}>
        {APP_NAME.toLowerCase()}
      </AppText>
    </View>
  );
}
