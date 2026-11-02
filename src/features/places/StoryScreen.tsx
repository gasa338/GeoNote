/**
 * **Story viewer** — full-screen photos of a place, one after another
 * (design: "Atelje Krug · Pre 2 h").
 *
 * - Tap the right half of the photo → next, left half → previous.
 * - Moves on by itself after `SLIDE_MS`.
 * - "View place" opens the place profile.
 *
 * Route: `src/app/story/[placeId].tsx` (`?index=` = first slide).
 *
 * @module features/places/StoryScreen
 * @category Feature: Places nearby
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Icon, IconTile } from '@/components/ui';
import { useLanguage, useT } from '@/i18n/useT';
import { radius, spacing, useTheme } from '@/theme';

import { getDemoPlace, pick } from './demoPlaces';

/** How long one slide stays (ms). */
const SLIDE_MS = 7000;

export default function StoryScreen() {
  const t = useT();
  const language = useLanguage();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { placeId, index } = useLocalSearchParams<{ placeId: string; index?: string }>();
  const place = getDemoPlace(placeId);
  const [current, setCurrent] = useState(Number(index ?? 0) || 0);

  const slides = place?.story ?? [];
  const slide = slides[current];

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function next() {
    if (current < slides.length - 1) setCurrent(current + 1);
    else close();
  }

  function previous() {
    if (current > 0) setCurrent(current - 1);
  }

  // Next slide after a while.
  useEffect(() => {
    const timer = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(timer);
    // Restart the timer for every slide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (!place || !slide) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Photo with tap zones */}
      <View style={styles.photo}>
        <Image source={slide.image} style={styles.image} resizeMode="cover" />
        <View style={styles.shade} />
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Pressable style={{ flex: 1 }} onPress={previous} accessibilityLabel="Previous" />
            <Pressable style={{ flex: 1 }} onPress={next} accessibilityLabel="Next" />
          </View>
        </View>

        {/* Progress bars and header */}
        <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
          <View style={styles.bars}>
            {slides.map((_, barIndex) => (
              <View key={barIndex} style={[styles.bar, { backgroundColor: barIndex <= current ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }]} />
            ))}
          </View>
          <View style={styles.header} pointerEvents="box-none">
            <IconTile name={place.icon} size={40} style={{ backgroundColor: '#FFFFFF' }} />
            <View style={{ flex: 1 }}>
              <AppText variant="headline" style={styles.white}>
                {place.name}
              </AppText>
              <AppText variant="caption" style={styles.whiteSoft}>
                {t.common.hoursAgo(2)} · {place.area}
              </AppText>
            </View>
            <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.story.close}>
              <Icon name="close" size={28} color="onPrimary" />
            </Pressable>
          </View>
        </View>

        <AppText variant="overline" style={[styles.caption, styles.white]}>
          {pick(slide.caption, language)} · {current + 1} / {slides.length}
        </AppText>
      </View>

      {/* Text sheet */}
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <AppText variant="display">{pick(slide.title, language)}</AppText>
        <AppText variant="body" color="textSecondary">
          {pick(slide.text, language)}
        </AppText>
        <Button
          title={t.story.viewPlace}
          icon="arrow-forward"
          onPress={() => router.replace({ pathname: '/places/[id]', params: { id: place.id } })}
        />
        <AppText variant="caption" color="textTertiary" style={{ fontSize: 11 }}>
          {t.story.disclaimer}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { flex: 1 },
  image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.12)' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg, gap: spacing.md },
  bars: { flexDirection: 'row', gap: spacing.xs },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  caption: { position: 'absolute', left: spacing.screen, bottom: radius.sheet + spacing.md, fontSize: 11 },
  white: { color: '#FFFFFF' },
  whiteSoft: { color: 'rgba(255,255,255,0.85)' },
  sheet: {
    marginTop: -radius.sheet,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginTop: spacing.sm },
});
