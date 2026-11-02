/**
 * @module components/ui/TextField
 * @category UI components
 */
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/** Props of {@link TextField} (plus all normal `TextInput` props). */
export interface TextFieldProps extends TextInputProps {
  /** Label above the field. */
  label?: string;
  /** Icon inside the field, on the left. */
  icon?: IconName;
}

/** A text input with a label. The border turns blue while typing. */
export function TextField({ label, icon, multiline, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <AppText variant="caption" color="textSecondary" style={{ fontWeight: '600' }}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          multiline && styles.multilineBox,
          {
            backgroundColor: colors.surface,
            borderColor: focused ? colors.primary : colors.border,
          },
        ]}>
        {icon ? <Icon name={icon} size={20} color="textTertiary" /> : null}
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor={colors.textTertiary}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[typography.body, styles.input, multiline && styles.multilineInput, { color: colors.text }, style]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 54,
  },
  multilineBox: { alignItems: 'flex-start', paddingVertical: spacing.md },
  input: { flex: 1, paddingVertical: spacing.md },
  multilineInput: { minHeight: 84, textAlignVertical: 'top', paddingVertical: 0 },
});
