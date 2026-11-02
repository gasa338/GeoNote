/**
 * **Places nearby** (design: "Mesta u blizini") — public places (culture, shops)
 * with search, filters, distance and Follow.
 *
 * Content is example data from `demoPlaces.ts` until the Django API exists.
 *
 * Route: `src/app/(tabs)/places/index.tsx`.
 *
 * @module features/places/PlacesNearbyScreen
 * @category Feature: Places nearby
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Chip, Icon } from '@/components/ui';
import { useArea } from '@/hooks/useArea';
import { usePosition } from '@/hooks/usePosition';
import { useLanguage, useT } from '@/i18n/useT';
import { isInTabBar } from '@/navigation/features';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, typography, useTheme } from '@/theme';
import { distanceMeters, formatDistance } from '@/utils/geo';

import { FollowButton } from './components/PlaceParts';
import { DEMO_PLACES, pick, type PlaceCategory } from './demoPlaces';

export default function PlacesNearbyScreen() {
  const t = useT();
  const language = useLanguage();
  const { colors } = useTheme();
  const position = usePosition();
  const area = useArea(position);
  const tabBar = useAppStore((state) => state.settings.tabBar);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PlaceCategory | 'all'>('all');

  const search = query.trim().toLowerCase();
  const places = DEMO_PLACES.filter((place) => category === 'all' || place.category === category)
    .filter((place) => !search || `${place.name} ${place.address}`.toLowerCase().includes(search))
    .map((place) => ({ place, distance: position ? distanceMeters(position, place) : null }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  return (
    <SheetScreen backLabel={isInTabBar(tabBar, 'places') ? undefined : t.more.back}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">{t.places.title}</AppText>
        <AppText variant="body" color="textSecondary">
          {t.places.subtitle}
        </AppText>
      </View>

      <View style={[styles.search, { backgroundColor: colors.surfaceMuted }]}>
        <Icon name="search" size={20} color="textSecondary" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.places.searchPlaceholder}
          placeholderTextColor={colors.textTertiary}
          style={[typography.body, { flex: 1, color: colors.text, paddingVertical: spacing.md }]}
        />
      </View>

      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Chip label={t.places.filterAll} selected={category === 'all'} onPress={() => setCategory('all')} />
          <Chip label={t.places.filterCulture} selected={category === 'culture'} onPress={() => setCategory('culture')} />
          <Chip label={t.places.filterShops} selected={category === 'shop'} onPress={() => setCategory('shop')} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="body" style={{ fontWeight: '600' }}>
            {t.places.aroundYou(area ?? '…')}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {t.places.nearestFirst}
          </AppText>
        </View>

        {places.length === 0 ? (
          <AppText variant="body" color="textSecondary">
            {t.places.noResults}
          </AppText>
        ) : null}

        {places.map(({ place, distance }) => (
          <Pressable
            key={place.id}
            accessibilityRole="button"
            accessibilityLabel={place.name}
            onPress={() => router.push({ pathname: '/places/[id]', params: { id: place.id } })}
            style={({ pressed }) => [styles.card, { borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
            <Image source={place.thumbnail} style={styles.thumb} resizeMode="cover" />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
                {pick(place.type, language)}
                {distance !== null ? ` · ${formatDistance(distance)}` : ''}
              </AppText>
              <AppText variant="title" style={{ fontSize: 19 }}>
                {place.name}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {place.address}, {place.area}
              </AppText>
              <View style={{ marginTop: spacing.sm }}>
                <FollowButton placeId={place.id} />
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <AppText variant="caption" color="textTertiary" style={{ fontSize: 12 }}>
        {t.places.disclaimer}
      </AppText>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  card: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  thumb: { width: 104, height: 104, borderRadius: radius.md },
});
