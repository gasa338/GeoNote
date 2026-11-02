/**
 * Icons. The app uses the **Ionicons** set (https://icons.expo.fyi — filter by "Ionicons").
 *
 * @module components/ui/Icon
 * @category UI components
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, useTheme, type ThemeColors } from '@/theme';

/** Any Ionicons name, e.g. `"location-outline"`. */
export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Props of {@link Icon}. */
export interface IconProps {
  name: IconName;
  /** Size in points. Default 22. */
  size?: number;
  /** Color name from the theme. Default: `text`. */
  color?: keyof ThemeColors;
}

/** A single icon in a theme color. */
export function Icon({ name, size = 22, color = 'text' }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={colors[color]} />;
}

/** Color pairs for {@link IconTile}: soft background + strong icon color. */
export type IconTileTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

/** Props of {@link IconTile}. */
export interface IconTileProps {
  name: IconName;
  tone?: IconTileTone;
  /** Tile size in points. Default 44. */
  size?: number;
  /** Custom color (e.g. a zone type color). Overrides `tone`; the background is a pale version of it. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * An icon on a soft, rounded colored square. Used at the start of cards and rows
 * so the user can recognise items at a glance.
 */
export function IconTile({ name, tone = 'primary', size = 44, color, style }: IconTileProps) {
  const { colors } = useTheme();

  // Pick the background and icon color for the tone.
  let backgroundColor = colors.surfaceMuted;
  let iconColor: keyof ThemeColors = 'textSecondary';
  if (tone === 'primary') {
    backgroundColor = colors.primarySoft;
    iconColor = 'primary';
  } else if (tone === 'accent') {
    backgroundColor = colors.accentSoft;
    iconColor = 'accent';
  } else if (tone === 'success') {
    backgroundColor = colors.successSoft;
    iconColor = 'success';
  } else if (tone === 'warning') {
    backgroundColor = colors.warningSoft;
    iconColor = 'warning';
  } else if (tone === 'danger') {
    backgroundColor = colors.dangerSoft;
    iconColor = 'danger';
  }

  if (color) {
    return (
      <View
        style={[
          { width: size, height: size, borderRadius: size >= 44 ? radius.md : radius.sm, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}>
        <Ionicons name={name} size={Math.round(size * 0.5)} color={color} />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size >= 44 ? radius.md : radius.sm,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <Icon name={name} size={Math.round(size * 0.5)} color={iconColor} />
    </View>
  );
}
