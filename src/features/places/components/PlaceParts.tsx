/**
 * Small building blocks of the public-place screens:
 * {@link FollowButton}, {@link HighlightCircle} and {@link PostCard}.
 *
 * @module features/places/components/PlaceParts
 * @category Feature: Places nearby
 */
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, IconTile, type IconName } from '@/components/ui';
import { useLanguage, useT } from '@/i18n/useT';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, useTheme } from '@/theme';

import { getDemoPlace, pick, type Post } from '../demoPlaces';

/** "✓ Following" (pale) or "+ Follow" (filled). Saves immediately. */
export function FollowButton({ placeId, size = 'small' }: { placeId: string; size?: 'small' | 'large' }) {
  const t = useT();
  const { colors } = useTheme();
  const following = useAppStore((state) => state.social.followedPlaceIds.includes(placeId));
  const toggleFollow = useAppStore((state) => state.toggleFollow);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: following }}
      onPress={() => void toggleFollow(placeId)}
      style={({ pressed }) => [
        styles.follow,
        size === 'large' && styles.followLarge,
        { backgroundColor: following ? colors.primarySoft : colors.primary, opacity: pressed ? 0.8 : 1 },
      ]}>
      <Icon name={following ? 'checkmark' : 'add'} size={16} color={following ? 'primary' : 'onPrimary'} />
      <AppText variant="button" color={following ? 'primary' : 'onPrimary'} style={{ fontSize: 14 }}>
        {following ? t.places.following : t.places.follow}
      </AppText>
    </Pressable>
  );
}

/** A round story bubble with an icon and a label under it. */
export function HighlightCircle({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.highlight}>
      <View style={[styles.ring, { borderColor: colors.primary }]}>
        <View style={[styles.inner, { backgroundColor: colors.primarySoft }]}>
          <Icon name={icon} size={24} color="primary" />
        </View>
      </View>
      <AppText variant="caption" numberOfLines={1} style={{ fontSize: 12, maxWidth: 84, textAlign: 'center' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Props of {@link PostCard}. */
export interface PostCardProps {
  post: Post;
  /** `large` = text then a wide photo (feed); `compact` = photo left, text right. */
  layout?: 'large' | 'compact';
  /** Show the place header (hidden on the place's own profile). */
  showPlace?: boolean;
  /** Small label above the post (e.g. "EXAMPLE PROGRAMME"). */
  label?: string;
  onPressPlace?: () => void;
}

/** A post of a public place, with likes and "Save". */
export function PostCard({ post, layout = 'large', showPlace = true, label, onPressPlace }: PostCardProps) {
  const t = useT();
  const language = useLanguage();
  const place = getDemoPlace(post.placeId);
  const liked = useAppStore((state) => state.social.likedPostIds.includes(post.id));
  const saved = useAppStore((state) => state.social.savedPostIds.includes(post.id));
  const toggleLiked = useAppStore((state) => state.toggleLikedPost);
  const toggleSaved = useAppStore((state) => state.toggleSavedPost);

  return (
    <View style={{ gap: spacing.md }}>
      {showPlace && place ? (
        <Pressable onPress={onPressPlace} style={styles.placeRow} accessibilityRole="button">
          <IconTile name={place.icon} size={36} />
          <View style={{ flex: 1 }}>
            <AppText variant="headline">{place.name}</AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
              {t.common.hoursAgo(post.hoursAgo)} · {place.area}
            </AppText>
          </View>
          <Icon name="ellipsis-horizontal" size={20} color="textSecondary" />
        </Pressable>
      ) : null}

      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="overline" color="primary" style={{ fontSize: 11 }}>
            {label}
          </AppText>
          <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
            {t.common.hoursAgo(post.hoursAgo)}
          </AppText>
        </View>
      ) : null}

      {layout === 'large' ? (
        <>
          <AppText variant="body">{pick(post.text, language)}</AppText>
          <Image source={post.image} style={styles.largeImage} resizeMode="cover" />
        </>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Image source={post.image} style={styles.compactImage} resizeMode="cover" />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText variant="headline" style={{ fontSize: 17 }}>
              {pick(post.title, language)}
            </AppText>
            <AppText variant="caption" color="textSecondary" numberOfLines={4}>
              {pick(post.text, language)}
            </AppText>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable onPress={() => void toggleLiked(post.id)} style={styles.action} hitSlop={8} accessibilityRole="button">
          <Icon name={liked ? 'heart' : 'heart-outline'} size={20} color="primary" />
          <AppText variant="caption" color="textSecondary">
            {t.post.likes(post.likes + (liked ? 1 : 0))}
          </AppText>
        </Pressable>
        <Pressable onPress={() => void toggleSaved(post.id)} style={styles.action} hitSlop={8} accessibilityRole="button">
          <Icon name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? 'primary' : 'textSecondary'} />
          <AppText variant="caption" color={saved ? 'primary' : 'textSecondary'}>
            {saved ? t.post.saved : t.post.save}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  follow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radius.md,
  },
  followLarge: { height: 42, paddingHorizontal: spacing.lg },
  highlight: { alignItems: 'center', gap: spacing.xs, width: 84 },
  ring: { width: 72, height: 72, borderRadius: 24, borderWidth: 2, padding: 4 },
  inner: { flex: 1, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  largeImage: { width: '100%', height: 190, borderRadius: radius.lg },
  compactImage: { width: 104, height: 104, borderRadius: radius.md },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
