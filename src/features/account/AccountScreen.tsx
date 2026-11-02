/**
 * **Account** (design: "Nalog") — current plan (Guest), free account and Pro.
 *
 * Sign-up and Pro need the server (phase 2), so their buttons explain that
 * for now. The design's guest limit (3 zones) is **not** enforced yet — set
 * `GUEST_ZONE_LIMIT_ENFORCED` when accounts exist.
 *
 * Route: `src/app/(tabs)/account.tsx`.
 *
 * @module features/account/AccountScreen
 * @category Feature: Account
 */
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Icon, IconTile } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { isInTabBar } from '@/navigation/features';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, useTheme } from '@/theme';

/** When accounts exist, set to true and check the limit in the zone editor. */
export const GUEST_ZONE_LIMIT_ENFORCED = false;

export default function AccountScreen() {
  const t = useT();
  const { colors } = useTheme();
  const tabBar = useAppStore((state) => state.settings.tabBar);

  function comingSoon() {
    Alert.alert(t.account.soonTitle, t.account.soonText);
  }

  return (
    <SheetScreen backLabel={isInTabBar(tabBar, 'account') ? undefined : t.more.back}>
      <AppText variant="display">{t.account.title}</AppText>

      <View style={{ gap: spacing.md }}>
        <AppText variant="overline" color="textSecondary">
          {t.account.yourSpace}
        </AppText>

        {/* Guest (current) */}
        <View style={[styles.card, { borderColor: colors.border }]}>
          <View style={styles.row}>
            <IconTile name="person-outline" tone="neutral" size={44} style={{ borderRadius: 22 }} />
            <View style={{ flex: 1 }}>
              <AppText variant="headline">{t.account.guest}</AppText>
              <AppText variant="caption" color="textSecondary">
                {t.account.guestText}
              </AppText>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
              <AppText variant="overline" color="success" style={{ fontSize: 10 }}>
                {t.account.current}
              </AppText>
            </View>
          </View>
        </View>

        {/* Free account */}
        <View style={[styles.card, { borderColor: colors.border, gap: spacing.xs }]}>
          <View style={styles.row}>
            <AppText variant="headline" style={{ flex: 1 }}>
              {t.account.free}
            </AppText>
            <AppText variant="headline">{t.account.freePrice}</AppText>
          </View>
          <AppText variant="caption" color="textSecondary">
            {t.account.freeText}
          </AppText>
          <Pressable onPress={comingSoon} style={styles.row} accessibilityRole="button">
            <AppText variant="button" color="primary" style={{ fontSize: 15 }}>
              {t.account.register} →
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {t.account.orSignIn}
            </AppText>
          </Pressable>
        </View>

        {/* Pro */}
        <View style={[styles.card, { borderColor: colors.primary, backgroundColor: colors.primarySoft, gap: spacing.xs }]}>
          <View style={styles.row}>
            <Icon name="sparkles-outline" size={20} color="primary" />
            <AppText variant="headline" style={{ flex: 1 }}>
              {t.account.pro}
            </AppText>
            <AppText variant="headline" color="primary">
              {t.account.proPrice}
            </AppText>
          </View>
          <AppText variant="caption" color="textSecondary">
            {t.account.proText}
          </AppText>
          <Pressable onPress={comingSoon} accessibilityRole="button">
            <AppText variant="button" color="primary" style={{ fontSize: 15 }}>
              {t.account.explorePro} →
            </AppText>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={() => router.navigate('/settings')} style={styles.row} accessibilityRole="button">
        <IconTile name="options-outline" size={44} />
        <View style={{ flex: 1 }}>
          <AppText variant="headline">{t.features.settings.title}</AppText>
          <AppText variant="caption" color="textSecondary">
            {t.features.settings.description}
          </AppText>
        </View>
        <Icon name="chevron-forward" size={20} color="textSecondary" />
      </Pressable>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 2, padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
});
