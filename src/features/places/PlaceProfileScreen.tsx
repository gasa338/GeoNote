/**
 * **Place profile** (design: "Atelje Krug") — cover photo, name, type, share,
 * description, address and distance, Follow, followers, story highlights,
 * tabs Posts / Events (coming soon).
 *
 * Route: `src/app/(tabs)/places/[id].tsx`.
 *
 * @module features/places/PlaceProfileScreen
 * @category Feature: Places nearby
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Icon, IconTile } from '@/components/ui';
import { usePosition } from '@/hooks/usePosition';
import { useLanguage, useT } from '@/i18n/useT';
import { spacing, useTheme } from '@/theme';
import { distanceMeters, formatDistance } from '@/utils/geo';

import { FollowButton, HighlightCircle, PostCard } from './components/PlaceParts';
import { DEMO_POSTS, getDemoPlace, pick } from './demoPlaces';

export default function PlaceProfileScreen() {
  const t = useT();
  const language = useLanguage();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = getDemoPlace(id);
  const position = usePosition();
  const [tab, setTab] = useState<'posts' | 'events'>('posts');

  if (!place) {
    return (
      <SheetScreen backLabel={t.placeProfile.back}>
        <AppText color="textSecondary">{t.placeProfile.missing}</AppText>
      </SheetScreen>
    );
  }

  const distance = position ? distanceMeters(position, place) : null;
  const posts = DEMO_POSTS.filter((post) => post.placeId === place.id);

  function share() {
    if (!place) return;
    void Share.share({ message: t.placeProfile.shareMessage(place.name, `${place.address}, ${place.area}`) });
  }

  function openStory(index: number) {
    router.push({ pathname: '/story/[placeId]', params: { placeId: id, index: String(index) } });
  }

  return (
    <SheetScreen backLabel={t.placeProfile.back} cover={place.cover} mapHeight={230} headerRight={null}>
      {/* Header */}
      <View style={{ gap: spacing.md }}>
        <View style={styles.headerRow}>
          <IconTile name={place.icon} size={56} />
          <View style={{ flex: 1 }}>
            <AppText variant="display">{place.name}</AppText>
            <AppText variant="caption" color="textSecondary">
              {pick(place.type, language)} · {place.area}
            </AppText>
          </View>
          <Pressable onPress={share} hitSlop={10} accessibilityRole="button" accessibilityLabel="Share">
            <Icon name="share-social-outline" size={22} color="textSecondary" />
          </Pressable>
        </View>
        <AppText variant="body">{pick(place.description, language)}</AppText>
        <View style={styles.inline}>
          <Icon name="location-outline" size={15} color="textSecondary" />
          <AppText variant="caption" color="textSecondary">
            {place.address}, Beograd{distance !== null ? ` · ${formatDistance(distance)}` : ''}
          </AppText>
        </View>
        <View style={[styles.inline, { justifyContent: 'space-between' }]}>
          <FollowButton placeId={place.id} size="large" />
          <AppText variant="caption" color="textSecondary">
            {t.placeProfile.stats(place.followers, place.postCount)}
          </AppText>
        </View>
      </View>

      {/* Story highlights */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
        {place.highlights.map((highlight, index) => (
          <HighlightCircle
            key={highlight.id}
            icon={highlight.icon}
            label={pick(highlight.label, language)}
            onPress={() => openStory(Math.min(index, place.story.length - 1))}
          />
        ))}
      </ScrollView>

      {/* Tabs */}
      <View style={{ gap: spacing.lg }}>
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {(['posts', 'events'] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === key }}
              style={[styles.tab, tab === key && { borderBottomColor: colors.primary }]}>
              <AppText variant="button" color={tab === key ? 'primary' : 'textSecondary'} style={{ fontSize: 15 }}>
                {key === 'posts' ? t.placeProfile.posts : t.placeProfile.events}
              </AppText>
              {key === 'events' ? (
                <AppText variant="caption" color="textTertiary" style={{ fontSize: 12 }}>
                  {' '}
                  · {t.placeProfile.soon}
                </AppText>
              ) : null}
            </Pressable>
          ))}
        </View>

        {tab === 'posts' ? (
          posts.map((post) => <PostCard key={post.id} post={post} layout="compact" showPlace={false} label={t.placeProfile.exampleProgram} />)
        ) : (
          <AppText variant="body" color="textSecondary">
            {t.placeProfile.eventsSoon}
          </AppText>
        )}
      </View>

      <AppText variant="caption" color="textTertiary" style={{ fontSize: 12 }}>
        {t.placeProfile.disclaimer}
      </AppText>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tabs: { flexDirection: 'row', gap: spacing.xl, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
});
