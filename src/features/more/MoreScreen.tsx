/**
 * **More** — the last tab (design: "Više").
 *
 * Guest card, then one row per section from the navigation registry
 * (`src/navigation/features.ts`, entries with `showInMore`), and a link to
 * "Organize navigation".
 *
 * Route: `src/app/(tabs)/more.tsx`.
 *
 * @module features/more/MoreScreen
 * @category Feature: More
 */
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Divider, Icon, IconTile, Pill } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { FEATURES } from '@/navigation/features';
import { radius, spacing, useTheme } from '@/theme';

export default function MoreScreen() {
  const t = useT();
  const { colors } = useTheme();
  const rows = FEATURES.filter((feature) => feature.showInMore);

  return (
    <SheetScreen headerLeft={<Logo size={30} />} mapHeight={230}>
      <AppText variant="display">{t.more.title}</AppText>

      {/* Guest card */}
      <View style={[styles.guest, { backgroundColor: colors.surfaceMuted }]}>
        <Icon name="person-outline" size={22} color="textSecondary" />
        <View style={{ flex: 1 }}>
          <AppText variant="body" style={{ fontWeight: '600' }}>
            {t.more.guestTitle}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {t.more.guestText}
          </AppText>
        </View>
        <Pressable onPress={() => router.navigate('/account')} hitSlop={8} accessibilityRole="button">
          <AppText variant="button" color="primary" style={{ fontSize: 15 }}>
            {t.more.signIn}
          </AppText>
        </Pressable>
      </View>

      {/* Sections */}
      <View>
        {rows.map((feature, index) => {
          const texts = t.features[feature.id];
          return (
            <View key={feature.id}>
              {index > 0 ? <Divider /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={texts.title}
                onPress={() => router.navigate(feature.path as Href)}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
                <IconTile name={feature.icon} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="headline" style={{ fontSize: 17 }}>
                    {texts.title}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {texts.description}
                  </AppText>
                </View>
                {feature.status === 'comingSoon' ? <Pill label={t.common.comingSoon} tone="primary" /> : null}
                <Icon name="chevron-forward" size={20} color="textSecondary" />
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={{ gap: spacing.md }}>
        <View style={styles.footer}>
          <Icon name="layers-outline" size={16} color="textSecondary" />
          <AppText variant="caption" color="textSecondary">
            {t.more.footer}
          </AppText>
        </View>
        <Pressable onPress={() => router.push('/navigation')} style={styles.footer} accessibilityRole="button">
          <Icon name="reorder-three-outline" size={16} color="primary" />
          <AppText variant="caption" color="primary" style={{ fontWeight: '600' }}>
            {t.more.organize}
          </AppText>
        </Pressable>
      </View>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  guest: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
