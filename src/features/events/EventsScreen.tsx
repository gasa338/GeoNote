/**
 * **Events** — coming soon (design: "Događaji · Uskoro").
 *
 * Shows what the section will look like, with one example event.
 * To build it: load events (Django API), list them here, and add "Remind me
 * when I'm close" by creating a normal Zone around the event place.
 * Then set `status: 'ready'` in `src/navigation/features.ts`.
 *
 * Route: `src/app/(tabs)/events.tsx`.
 *
 * @module features/events/EventsScreen
 * @category Feature: Events
 */
import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Button, Icon, Pill } from '@/components/ui';
import { DEMO_POSTS } from '@/features/places/demoPlaces';
import { useT } from '@/i18n/useT';
import { isInTabBar } from '@/navigation/features';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, useTheme } from '@/theme';

export default function EventsScreen() {
  const t = useT();
  const { colors } = useTheme();
  const tabBar = useAppStore((state) => state.settings.tabBar);
  const exampleImage = DEMO_POSTS[0].image;

  return (
    <SheetScreen backLabel={isInTabBar(tabBar, 'events') ? undefined : t.more.back}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="calendar-outline" size={22} color="primary" />
          <Pill label={t.events.badge} tone="primary" />
        </View>
        <AppText variant="display">{t.events.title}</AppText>
        <AppText variant="body" color="textSecondary">
          {t.events.text}
        </AppText>
      </View>

      {/* Example event */}
      <View style={[styles.card, { borderColor: colors.border }]}>
        <Image source={exampleImage} style={styles.image} resizeMode="cover" />
        <View style={{ padding: spacing.md, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pill label={t.events.exampleBadge} tone="primary" />
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
              {t.events.exampleMeta}
            </AppText>
          </View>
          <AppText variant="title" style={{ fontSize: 19 }}>
            {t.events.exampleTitle}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {t.events.exampleLine}
          </AppText>
        </View>
      </View>

      <View style={[styles.info, { backgroundColor: colors.primarySoft }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="location-outline" size={20} color="primary" />
          <AppText variant="headline">{t.events.infoTitle}</AppText>
        </View>
        <AppText variant="caption" color="textSecondary">
          {t.events.infoText}
        </AppText>
      </View>

      <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }}>
        {t.events.disclaimer}
      </AppText>

      <Button title={t.events.explore} icon="arrow-forward" variant="soft" onPress={() => router.navigate('/places')} />
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 2, overflow: 'hidden' },
  image: { width: '100%', height: 150 },
  info: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
});
