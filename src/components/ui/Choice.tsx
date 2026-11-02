/**
 * Components for choosing one option: {@link SegmentedControl}, {@link OptionCard} and {@link Chip}.
 *
 * @module components/ui/Choice
 * @category UI components
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, IconTile, type IconName } from './Icon';

/** One option of a {@link SegmentedControl}. */
export interface SegmentOption {
  value: string;
  label: string;
}

/** Props of {@link SegmentedControl}. */
export interface SegmentedControlProps {
  /** The selected option's `value`. */
  value: string;
  options: SegmentOption[];
  onChange: (value: string) => void;
}

/**
 * 2–4 options side by side; the selected one is raised.
 * Good for short choices like "Every time / Only once" or "English / Srpski".
 */
export function SegmentedControl({ value, options, onChange }: SegmentedControlProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: colors.surface }]}>
            <AppText
              variant="button"
              color={selected ? 'text' : 'textSecondary'}
              style={{ fontSize: 15, fontWeight: selected ? '700' : '500' }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Props of {@link OptionCard}. */
export interface OptionCardProps {
  icon: IconName;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * A large selectable card with icon, title and description.
 * Used where the choice needs a short explanation (e.g. "When I arrive").
 */
export function OptionCard({ icon, title, description, selected, onPress }: OptionCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <IconTile name={icon} tone={selected ? 'primary' : 'neutral'} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="caption" color="textSecondary">
          {description}
        </AppText>
      </View>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.primary : colors.border },
          selected && { backgroundColor: colors.primary },
        ]}>
        {selected ? <Icon name="checkmark" size={14} color="onPrimary" /> : null}
      </View>
    </Pressable>
  );
}

/** Props of {@link Chip}. */
export interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: IconName;
  onPress: () => void;
}

/** A small pill button. Used for lists of choices that wrap (radius, places). */
export function Chip({ label, selected, icon, onPress }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surfaceMuted,
          borderColor: selected ? colors.primary : colors.surfaceMuted,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      {icon ? <Icon name={icon} size={16} color={selected ? 'onPrimary' : 'primary'} /> : null}
      <AppText variant="button" color={selected ? 'onPrimary' : 'text'} style={{ fontSize: 15 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    minHeight: 42,
  },
});
