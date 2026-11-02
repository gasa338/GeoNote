/**
 * @module components/ui/Button
 * @category UI components
 */
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme, type ThemeColors } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/**
 * - `primary` — the main action of a screen (filled blue). Use once per screen.
 * - `secondary` — other actions (soft grey).
 * - `ghost` — low-emphasis actions (blue text only).
 * - `soft` — secondary actions in the accent color (accent text on pale accent).
 * - `danger` — destructive actions such as delete (red text on soft red).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';

/** Props of {@link Button}. */
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Optional icon shown before the title. */
  icon?: IconName;
  disabled?: boolean;
  /** Shows a spinner instead of the title. */
  loading?: boolean;
  /** `small` is for buttons inside rows. Default `large`. */
  size?: 'large' | 'small';
  style?: StyleProp<ViewStyle>;
}

/** A tappable button with a label and an optional icon. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  size = 'large',
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  // Colors for each variant.
  let backgroundColor = colors.primary;
  let textColor: keyof ThemeColors = 'onPrimary';
  if (variant === 'secondary') {
    backgroundColor = colors.surfaceMuted;
    textColor = 'text';
  } else if (variant === 'soft') {
    backgroundColor = colors.primarySoft;
    textColor = 'primary';
  } else if (variant === 'ghost') {
    backgroundColor = 'transparent';
    textColor = 'primary';
  } else if (variant === 'danger') {
    backgroundColor = colors.dangerSoft;
    textColor = 'danger';
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        size === 'small' ? styles.small : styles.large,
        { backgroundColor, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors[textColor]} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={size === 'small' ? 16 : 20} color={textColor} /> : null}
          <AppText variant="button" color={textColor} style={size === 'small' && { fontSize: 14 }}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { minHeight: 56, paddingHorizontal: spacing.xl, borderRadius: 16 },
  small: { minHeight: 36, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
