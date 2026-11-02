/**
 * @module features/zones/components/RadiusSlider
 * @category Feature: Zones
 */
import Slider from '@react-native-community/slider';
import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { MIN_RADIUS } from '@/geo/constants';
import { useT } from '@/i18n/useT';
import { spacing, useTheme } from '@/theme';
import { formatRadius } from '@/utils/geo';

import { walkMinutes } from '../zoneVisuals';

/** Largest radius on the slider (meters). */
export const MAX_RADIUS = 1000;

/**
 * The slider steps: 10 m up to 100 m, 25 m up to 300 m, then 50 m.
 * Small zones need precision, big ones do not.
 */
function snap(value: number): number {
  if (value <= 100) return Math.round(value / 10) * 10;
  if (value <= 300) return Math.round(value / 25) * 25;
  return Math.round(value / 50) * 50;
}

/** Props of {@link RadiusSlider}. */
export interface RadiusSliderProps {
  value: number;
  onChange: (meters: number) => void;
}

/** "Zone radius — 200 m" with a slider and "20 m · About 3 min walk · 1 km" under it. */
export function RadiusSlider({ value, onChange }: RadiusSliderProps) {
  const t = useT();
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="headline">{t.zoneEditor.radius}</AppText>
        <AppText variant="title" color="primary" style={{ fontSize: 18, fontWeight: '500' }}>
          {formatRadius(value)}
        </AppText>
      </View>
      <Slider
        value={value}
        minimumValue={MIN_RADIUS}
        maximumValue={MAX_RADIUS}
        onValueChange={(raw) => onChange(snap(raw))}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
        accessibilityLabel={t.zoneEditor.radius}
        style={{ marginHorizontal: -spacing.sm, height: 36 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
          {formatRadius(MIN_RADIUS)}
        </AppText>
        <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
          {t.zoneEditor.walk(walkMinutes(value))}
        </AppText>
        <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
          {formatRadius(MAX_RADIUS)}
        </AppText>
      </View>
    </View>
  );
}
