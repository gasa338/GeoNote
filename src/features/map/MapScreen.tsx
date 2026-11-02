/**
 * **Map** — the first screen (design: "GeoNote" home).
 *
 * Top to bottom:
 * - logo + tagline, account button
 * - search ("Find a place or address" → opens "New zone" at that address)
 * - filter chips: All zones · Nearby (within 1 km)
 * - the map with zones (tap a zone → details), "+ New zone", "my location"
 * - sheet "Your places": nearest zones with distance and status
 * - status line: is tracking working? (tap → Location & notifications)
 *
 * Route: `src/app/(tabs)/index.tsx`.
 *
 * @module features/map/MapScreen
 * @category Feature: Map
 */
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DraggableSheet } from '@/components/DraggableSheet';
import { Logo } from '@/components/Logo';
import { WebMap, type MapView } from '@/components/map/WebMap';
import { AppText, Chip, Divider, Icon } from '@/components/ui';
import { ZoneRow } from '@/features/zones/components/ZoneRow';
import { toMapZone } from '@/features/zones/zoneVisuals';
import { usePosition } from '@/hooks/usePosition';
import { useTrackingStatus } from '@/hooks/useTrackingStatus';
import { useT } from '@/i18n/useT';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, typography, useTheme } from '@/theme';
import { distanceMeters } from '@/utils/geo';

/** "Nearby" filter distance in meters. */
const NEARBY_METERS = 1000;

/** Where the map starts without a known position (Belgrade). */
const FALLBACK_CENTER = { lat: 44.8, lng: 20.47 };

export default function MapScreen() {
  const t = useT();
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const position = usePosition();
  const status = useTrackingStatus();
  const zones = useAppStore((state) => state.zones);

  const [filter, setFilter] = useState<'all' | 'nearby'>('all');
  const [search, setSearch] = useState('');
  /** Bumped when the user taps "my location", so the map re-centers. */
  const [locateCount, setLocateCount] = useState(0);

  // Zones sorted by distance (nearest first), optionally only the nearby ones.
  const zonesWithDistance = zones
    .map((zone) => ({ zone, distance: position ? distanceMeters(position, zone) : null }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  const visible = filter === 'nearby' ? zonesWithDistance.filter((item) => item.distance !== null && item.distance <= NEARBY_METERS) : zonesWithDistance;

  // The sheet "Your places" can be dragged: small · default (design) · tall.
  const sheetHeight = Math.round(Math.min(380, height * 0.42));
  // The tall stop leaves room for the search bar, filters and the map buttons.
  const snapPoints = [190, sheetHeight, Math.max(sheetHeight, Math.round(height - insets.top - 270))];
  const [animatedSheetHeight] = useState(() => new Animated.Value(sheetHeight));
  /** Map parts hidden behind the header/search/chips and the sheet. */
  const padding = { top: insets.top + 190, bottom: sheetHeight + 70 };

  // Camera: after "my location" → center on the user; otherwise show the zones (and the user).
  const points: [number, number][] = visible.map(({ zone }) => [zone.latitude, zone.longitude]);
  if (position) points.push([position.latitude, position.longitude]);
  let view: MapView;
  if (locateCount > 0 && position) {
    view = { key: `locate-${locateCount}`, center: { lat: position.latitude, lng: position.longitude }, zoom: 16, padding };
  } else if (points.length > 1) {
    view = { key: `fit-${filter}-${visible.length}-${position ? 'p' : 'n'}`, fit: points, padding };
  } else if (points.length === 1) {
    view = { key: `one-${filter}-${points[0].join()}`, center: { lat: points[0][0], lng: points[0][1] }, zoom: 15, padding };
  } else {
    view = { key: 'fallback', center: FALLBACK_CENTER, zoom: 13 };
  }

  /** Search → open "New zone" at the found address. */
  async function submitSearch() {
    const query = search.trim();
    if (!query) return;
    try {
      const [found] = await Location.geocodeAsync(query);
      if (!found) {
        Alert.alert(t.zoneEditor.notFoundTitle, t.map.searchNotFound);
        return;
      }
      setSearch('');
      router.push({
        pathname: '/edit-zone/[id]',
        params: { id: 'new', name: query, lat: String(found.latitude), lng: String(found.longitude) },
      });
    } catch {
      Alert.alert(t.zoneEditor.searchFailedTitle, t.zoneEditor.searchFailedText);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <WebMap
        zones={visible.map(({ zone }) => toMapZone(zone, colors.primary))}
        user={position}
        view={view}
        onZonePress={(id) => router.push({ pathname: '/zones/[id]', params: { id, from: '/' } })}
        style={StyleSheet.absoluteFill}
      />

      {/* Header, search and filters over the map */}
      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View style={styles.headerRow} pointerEvents="box-none">
          <View>
            <Logo size={30} />
            <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {t.brand.tagline}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.map.profile}
            onPress={() => router.navigate('/account')}
            style={[styles.roundButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="person-outline" size={20} />
          </Pressable>
        </View>

        <View style={[styles.search, { backgroundColor: colors.surface }, shadows.floating]}>
          <Icon name="search" size={20} color="textSecondary" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => void submitSearch()}
            returnKeyType="search"
            placeholder={t.map.searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            style={[typography.body, { flex: 1, color: colors.text, paddingVertical: spacing.md }]}
          />
        </View>

        <View style={styles.chips} pointerEvents="box-none">
          <Chip icon="layers-outline" label={t.map.allZones(zones.length)} selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label={t.map.nearby} selected={filter === 'nearby'} onPress={() => setFilter('nearby')} />
        </View>
      </View>

      {/* Buttons at the bottom of the map */}
      <Animated.View style={[styles.mapButtons, { bottom: Animated.add(animatedSheetHeight, spacing.lg) }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/edit-zone/[id]', params: { id: 'new' } })}
          style={({ pressed }) => [styles.newZone, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }, shadows.floating]}>
          <Icon name="add" size={22} color="onPrimary" />
          <AppText variant="button" color="onPrimary">
            {t.map.newZone}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.map.locate}
          onPress={() => setLocateCount((count) => count + 1)}
          style={[styles.roundButton, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.floating]}>
          <Icon name="locate" size={22} color="primary" />
        </Pressable>
      </Animated.View>

      {/* Sheet "Your places" — drag it up/down */}
      <DraggableSheet
        snapPoints={snapPoints}
        initialSnap={1}
        height={animatedSheetHeight}
        header={
          <View style={styles.sheetHeader}>
            <AppText variant="title" style={{ fontWeight: '500', fontSize: 22 }}>
              {t.map.yourPlaces}
            </AppText>
            {zones.length > 0 ? (
              <Pressable onPress={() => router.navigate('/zones')} hitSlop={8} accessibilityRole="button">
                <AppText variant="button" color="primary" style={{ fontSize: 15 }}>
                  {t.map.allZonesLink(zones.length)} →
                </AppText>
              </Pressable>
            ) : null}
          </View>
        }
        footer={
          status ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/permissions')}
              style={[styles.status, { borderTopColor: colors.border }]}>
              <Icon name={status.icon} size={16} color={status.ok ? 'textSecondary' : 'warning'} />
              <AppText variant="caption" color={status.ok ? 'textSecondary' : 'warning'} style={{ flex: 1, fontSize: 12 }} numberOfLines={2}>
                {status.text}
              </AppText>
            </Pressable>
          ) : undefined
        }>
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen }}>
          {zones.length === 0 ? (
            <View style={{ paddingVertical: spacing.lg, gap: spacing.xs }}>
              <AppText variant="headline">{t.map.emptyTitle}</AppText>
              <AppText variant="body" color="textSecondary">
                {t.map.emptyText}
              </AppText>
            </View>
          ) : visible.length === 0 ? (
            <AppText variant="body" color="textSecondary" style={{ paddingVertical: spacing.lg }}>
              {t.map.nearbyEmpty}
            </AppText>
          ) : (
            visible.slice(0, 6).map(({ zone }, index) => (
              <View key={zone.id}>
                {index > 0 ? <Divider /> : null}
                <ZoneRow zone={zone} position={position} onPress={() => router.push({ pathname: '/zones/[id]', params: { id: zone.id, from: '/' } })} />
              </View>
            ))
          )}
        </ScrollView>
      </DraggableSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.screen, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  chips: { flexDirection: 'row', gap: spacing.sm },
  mapButtons: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xs,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
