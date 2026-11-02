/**
 * Row components used inside cards: {@link SwitchRow}, {@link InfoRow}, plus the {@link Pill} label.
 *
 * @module components/ui/Rows
 * @category UI components
 */
import type { ReactNode } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, IconTile, type IconName, type IconTileTone } from './Icon';

/** Props of {@link SwitchRow}. */
export interface SwitchRowProps {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** A label with an on/off switch on the right. */
export function SwitchRow({ label, hint, value, onChange }: SwitchRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="headline">{label}</AppText>
        {hint ? (
          <AppText variant="caption" color="textSecondary">
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
  );
}

/** Props of {@link InfoRow}. */
export interface InfoRowProps {
  icon: IconName;
  iconTone?: IconTileTone;
  title: string;
  subtitle?: string;
  /** Element on the right: a pill, a small button, a chevron… */
  right?: ReactNode;
}

/** Icon tile + title + subtitle + optional element on the right. Used in Settings. */
export function InfoRow({ icon, iconTone = 'neutral', title, subtitle, right }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <IconTile name={icon} tone={iconTone} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="headline">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Props of {@link Pill}. */
export interface PillProps {
  label: string;
  icon?: IconName;
  tone?: 'neutral' | 'primary' | 'accent' | 'success' | 'warning';
}

/** A small rounded label, e.g. "On arrival" or "Allowed". */
export function Pill({ label, icon, tone = 'neutral' }: PillProps) {
  const { colors } = useTheme();

  let backgroundColor = colors.surfaceMuted;
  let textColor: 'textSecondary' | 'primary' | 'accent' | 'success' | 'warning' = 'textSecondary';
  if (tone === 'primary') {
    backgroundColor = colors.primarySoft;
    textColor = 'primary';
  } else if (tone === 'accent') {
    backgroundColor = colors.accentSoft;
    textColor = 'accent';
  } else if (tone === 'success') {
    backgroundColor = colors.successSoft;
    textColor = 'success';
  } else if (tone === 'warning') {
    backgroundColor = colors.warningSoft;
    textColor = 'warning';
  }

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      {icon ? <Icon name={icon} size={13} color={textColor} /> : null}
      <AppText variant="caption" color={textColor} style={{ fontSize: 13, fontWeight: '600' }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
