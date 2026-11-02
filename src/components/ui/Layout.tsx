/**
 * Screen-level building blocks: {@link ScreenHeader}, {@link EmptyState},
 * {@link FloatingButton}, {@link BottomActionBar} and {@link Notice}.
 *
 * @module components/ui/Layout
 * @category UI components
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/** Props of {@link ScreenHeader}. */
export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Shown above the title (e.g. the logo). */
  top?: ReactNode;
}

/** The big title at the top of each tab screen. */
export function ScreenHeader({ title, subtitle, top }: ScreenHeaderProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      {top ? <View style={{ marginBottom: spacing.lg }}>{top}</View> : null}
      <AppText variant="display" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" color="textSecondary">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

/** Props of {@link EmptyState}. */
export interface EmptyStateProps {
  icon: IconName;
  title: string;
  text: string;
  /** Usually a button. */
  action?: ReactNode;
}

/** Friendly message shown when a list is empty, with a clear next step. */
export function EmptyState({ icon, title, text, action }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Icon name={icon} size={40} color="primary" />
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title" center>
          {title}
        </AppText>
        <AppText variant="body" color="textSecondary" center>
          {text}
        </AppText>
      </View>
      {action ? <View style={{ alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

/** Props of {@link FloatingButton}. */
export interface FloatingButtonProps {
  label: string;
  icon?: IconName;
  onPress: () => void;
}

/**
 * The round-cornered button that floats in the bottom-right corner of a list
 * ("New reminder", "Add place"). It has a label, so its purpose is obvious.
 */
export function FloatingButton({ label, icon = 'add', onPress }: FloatingButtonProps) {
  const { colors, shadows } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        shadows.floating,
      ]}>
      <Icon name={icon} size={22} color="onPrimary" />
      <AppText variant="button" color="onPrimary">
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * A bar fixed to the bottom of an editor screen holding the main action (Save).
 * The button is always visible, no matter how far the user scrolled.
 */
export function BottomActionBar({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bottomBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}>
      {children}
    </View>
  );
}

/** Props of {@link Notice}. */
export interface NoticeProps {
  icon?: IconName;
  text: string;
  tone?: 'info' | 'warning';
}

/** A soft colored box with a short message (hints and warnings). */
export function Notice({ icon, text, tone = 'info' }: NoticeProps) {
  const { colors } = useTheme();
  const isWarning = tone === 'warning';
  return (
    <View
      style={[
        styles.notice,
        { backgroundColor: isWarning ? colors.warningSoft : colors.primarySoft },
      ]}>
      <Icon
        name={icon ?? (isWarning ? 'warning-outline' : 'information-circle-outline')}
        size={20}
        color={isWarning ? 'warning' : 'primary'}
      />
      <AppText variant="caption" color={isWarning ? 'warning' : 'primary'} style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.screen,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  bottomBar: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'flex-start',
  },
});
