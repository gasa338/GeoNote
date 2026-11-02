/**
 * **Following** (design: "Pratim") — the places you follow (tap a circle for
 * its story) and their posts, newest first.
 *
 * Route: `src/app/(tabs)/following.tsx`.
 *
 * @module features/following/FollowingScreen
 * @category Feature: Following
 */
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Button, Divider, Icon } from '@/components/ui';
import { HighlightCircle, PostCard } from '@/features/places/components/PlaceParts';
import { DEMO_PLACES, DEMO_POSTS } from '@/features/places/demoPlaces';
import { useT } from '@/i18n/useT';
import { isInTabBar } from '@/navigation/features';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, useTheme } from '@/theme';

export default function FollowingScreen() {
  const t = useT();
  const { colors } = useTheme();
  const followedIds = useAppStore((state) => state.social.followedPlaceIds);
  const tabBar = useAppStore((state) => state.settings.tabBar);

  const followed = DEMO_PLACES.filter((place) => followedIds.includes(place.id));
  const posts = DEMO_POSTS.filter((post) => followedIds.includes(post.placeId)).sort((a, b) => a.hoursAgo - b.hoursAgo);

  return (
    <SheetScreen backLabel={isInTabBar(tabBar, 'following') ? undefined : t.more.back}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <AppText variant="display">{t.following.title}</AppText>
        <AppText variant="button" color="primary" style={{ fontSize: 15, marginBottom: 6 }}>
          {t.following.count(followed.length)}
        </AppText>
      </View>

      {followed.length === 0 ? (
        <View style={{ gap: spacing.md }}>
          <AppText variant="headline">{t.following.emptyTitle}</AppText>
          <AppText variant="body" color="textSecondary">
            {t.following.emptyText}
          </AppText>
          <Button title={t.following.explore} icon="arrow-forward" variant="soft" onPress={() => router.navigate('/places')} />
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
            {followed.map((place) => (
              <HighlightCircle
                key={place.id}
                icon={place.icon}
                label={place.name}
                onPress={() => router.push({ pathname: '/story/[placeId]', params: { placeId: place.id, index: '0' } })}
              />
            ))}
          </ScrollView>

          <View style={{ gap: spacing.lg }}>
            {posts.map((post, index) => (
              <View key={post.id} style={{ gap: spacing.lg }}>
                {index > 0 ? <Divider /> : null}
                <PostCard
                  post={post}
                  layout={index === 0 ? 'large' : 'compact'}
                  onPressPlace={() => router.push({ pathname: '/places/[id]', params: { id: post.placeId, from: '/following' } })}
                />
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted }}>
        <Icon name="information-circle-outline" size={16} color="textSecondary" />
        <AppText variant="caption" color="textSecondary" style={{ flex: 1, fontSize: 12 }}>
          {t.following.disclaimer}
        </AppText>
      </View>
    </SheetScreen>
  );
}
