/**
 * @module features/settings/components/LiveDistances
 * @category Feature: Settings
 */
import type { LocationObject } from 'expo-location';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppText, Divider, Pill } from '@/components/ui';
import type { Zone } from '@/data/types';
import { subscribeToPosition } from '@/geo/foregroundWatcher';
import { formatTime } from '@/i18n/dictionaries';
import { useLanguage, useT } from '@/i18n/useT';
import { spacing } from '@/theme';
import { distanceMeters, formatDistance } from '@/utils/geo';

/**
 * Live list "how far am I from each zone" — handy when testing by walking.
 * Updates with every new GPS position.
 */
export function LiveDistances({ zones }: { zones: Zone[] }) {
  const t = useT();
  const language = useLanguage();
  const [position, setPosition] = useState<LocationObject | null>(null);

  useEffect(() => subscribeToPosition(setPosition), []);

  if (!position) {
    return (
      <AppText variant="caption" color="textSecondary">
        {t.permissions.waitingForGps}
      </AppText>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="caption" color="textSecondary">
        {t.permissions.gpsAccuracy(Math.round(position.coords.accuracy ?? 0), formatTime(position.timestamp, language))}
      </AppText>
      {zones.map((zone, index) => {
        const distance = distanceMeters(position.coords, zone);
        const isInside = distance <= zone.radius;
        return (
          <View key={zone.id} style={{ gap: spacing.md }}>
            {index > 0 ? <Divider /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
                {zone.name}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {formatDistance(distance)}
              </AppText>
              <Pill tone={isInside ? 'success' : 'neutral'} label={isInside ? t.permissions.inside : t.permissions.outside} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
