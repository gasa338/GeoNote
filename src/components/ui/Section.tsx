/**
 * @module components/ui/Section
 * @category UI components
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';

/** Props of {@link Section}. */
export interface SectionProps {
  /** Short uppercase title, e.g. "LOCATION". */
  title: string;
  /** Optional one-line explanation under the title. */
  description?: string;
  /** Optional element on the right of the title (e.g. a count). */
  right?: ReactNode;
  children: ReactNode;
}

/**
 * A titled group of content. Screens are built from sections stacked with
 * generous space between them, so nothing feels crowded.
 */
export function Section({ title, description, right, children }: SectionProps) {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="overline" color="textSecondary">
            {title}
          </AppText>
          {right}
        </View>
        {description ? (
          <AppText variant="caption" color="textSecondary">
            {description}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}
