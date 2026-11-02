/**
 * @module components/ui/AppText
 * @category UI components
 */
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { typography, useTheme, type ThemeColors, type TypographyVariant } from '@/theme';

/** Props of {@link AppText}. */
export interface AppTextProps extends TextProps {
  /** Text style from the theme. Default: `body`. */
  variant?: TypographyVariant;
  /** Color name from the theme. Default: `text`. */
  color?: keyof ThemeColors;
  /** Center the text. */
  center?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * The text component used everywhere in the app.
 * It applies the theme's font size and color, so screens stay consistent.
 *
 * @example
 * ```tsx
 * <AppText variant="display">Reminders</AppText>
 * <AppText variant="caption" color="textSecondary">3 active</AppText>
 * ```
 */
export function AppText({ variant = 'body', color = 'text', center, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[typography[variant], { color: colors[color] }, center && { textAlign: 'center' }, style]}
    />
  );
}
