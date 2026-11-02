/**
 * @module components/ui/Card
 * @category UI components
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

/** Props of {@link Card}. */
export interface CardProps {
  children: ReactNode;
  /** If set, the whole card is tappable. */
  onPress?: () => void;
  /** Remove the inner padding (e.g. for a map that fills the card). */
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * A white rounded panel with a thin border. The basic building block of every screen.
 */
export function Card({ children, onPress, noPadding, style, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
    noPadding && { padding: 0 },
    style,
  ];

  if (!onPress) return <View style={cardStyle}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
      {children}
    </Pressable>
  );
}

/** A thin line to separate rows inside a card. */
export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: spacing.lg,
    overflow: 'hidden',
  },
});
