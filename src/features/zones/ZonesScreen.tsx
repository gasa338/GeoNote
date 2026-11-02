/**
 * **My zones** — every zone in one list, with filters All / Active / Paused.
 *
 * Route: `src/app/(tabs)/zones/index.tsx`.
 *
 * @module features/zones/ZonesScreen
 * @category Feature: Zones
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Logo } from '@/components/Logo';
import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Button, Chip, Divider } from '@/components/ui';
import { usePosition } from '@/hooks/usePosition';
import { useT } from '@/i18n/useT';
import { isInTabBar } from '@/navigation/features';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme';
import { distanceMeters } from '@/utils/geo';

import { ZoneRow } from './components/ZoneRow';

type Filter = 'all' | 'active' | 'paused';

export default function ZonesScreen() {
  const t = useT();
  const position = usePosition();
  const zones = useAppStore((state) => state.zones);
  const tabBar = useAppStore((state) => state.settings.tabBar);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = zones
    .filter((zone) => (filter === 'all' ? true : filter === 'active' ? zone.active : !zone.active))
    .sort((a, b) => (position ? distanceMeters(position, a) - distanceMeters(position, b) : 0));

  return (
    <SheetScreen
      backLabel={isInTabBar(tabBar, 'zones') ? undefined : t.more.back}
      headerLeft={<Logo size={26} />}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <AppText variant="display">{t.zones.title}</AppText>
        <AppText variant="button" color="primary" style={{ fontSize: 15, marginBottom: 6 }}>
          {t.zones.subtitle(zones.length)}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Chip label={t.zones.filterAll} selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={t.zones.filterActive} selected={filter === 'active'} onPress={() => setFilter('active')} />
        <Chip label={t.zones.filterPaused} selected={filter === 'paused'} onPress={() => setFilter('paused')} />
      </View>

      {filtered.length === 0 ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="headline">{t.zones.emptyTitle}</AppText>
          <AppText variant="body" color="textSecondary">
            {t.zones.emptyText}
          </AppText>
        </View>
      ) : (
        <View>
          {filtered.map((zone, index) => (
            <View key={zone.id}>
              {index > 0 ? <Divider /> : null}
              <ZoneRow zone={zone} position={position} onPress={() => router.push({ pathname: '/zones/[id]', params: { id: zone.id } })} />
            </View>
          ))}
        </View>
      )}

      <Button title={t.map.newZone} icon="add" onPress={() => router.push({ pathname: '/edit-zone/[id]', params: { id: 'new' } })} />
    </SheetScreen>
  );
}
