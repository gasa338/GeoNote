/**
 * **Organize navigation** — choose which sections are in the bottom tab bar
 * and in what order. Every change is saved immediately.
 *
 * - Up to {@link MAX_TAB_BAR_ITEMS} sections fit in the bar; "More" is always last.
 * - Arrows move a section left/right in the bar (shown here as up/down).
 * - Sections not in the bar stay reachable through "More".
 *
 * Opened from Settings → Navigation, and from the "More" tab.
 * Route: `src/app/navigation.tsx`.
 *
 * @module features/settings/NavigationEditorScreen
 * @category Feature: Settings
 */
import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Divider, Icon, IconTile, Notice, Section, type IconName } from '@/components/ui';
import { DEFAULT_SETTINGS } from '@/data/settings';
import type { FeatureId } from '@/data/types';
import { useT } from '@/i18n/useT';
import { getHiddenFeatures, getTabBarFeatures, MAX_TAB_BAR_ITEMS } from '@/navigation/features';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, useTheme } from '@/theme';

/** A small round icon button (used for up / down / remove / add). */
function RoundButton({
  icon,
  label,
  onPress,
  disabled,
  tone = 'neutral',
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'primary' | 'danger';
}) {
  const { colors } = useTheme();
  let iconColor: 'textSecondary' | 'primary' | 'danger' = 'textSecondary';
  if (tone === 'primary') iconColor = 'primary';
  if (tone === 'danger') iconColor = 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.roundButton,
        { backgroundColor: colors.surfaceMuted, opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}>
      <Icon name={icon} size={18} color={iconColor} />
    </Pressable>
  );
}

export default function NavigationEditorScreen() {
  const t = useT();
  const { colors } = useTheme();
  const tabBar = useAppStore((state) => state.settings.tabBar);
  const setTabBar = useAppStore((state) => state.setTabBar);

  const inBar = getTabBarFeatures(tabBar);
  const others = getHiddenFeatures(tabBar);
  const barIsFull = inBar.length >= MAX_TAB_BAR_ITEMS;
  const barIds = inBar.map((feature) => feature.id);

  // ---- Actions (each one saves the new order right away) ---------------------

  /** Swaps a section with its neighbour. `direction` is -1 (up) or +1 (down). */
  function move(index: number, direction: -1 | 1) {
    const newOrder = [...barIds];
    const target = index + direction;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    void setTabBar(newOrder);
  }

  function remove(id: FeatureId) {
    void setTabBar(barIds.filter((barId) => barId !== id));
  }

  function add(id: FeatureId) {
    if (barIsFull) return;
    void setTabBar([...barIds, id]);
  }

  function resetToDefault() {
    void setTabBar(DEFAULT_SETTINGS.tabBar);
  }

  // ---- Screen ----------------------------------------------------------------

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: spacing.xxxl, gap: spacing.section }}>
      <Stack.Screen options={{ title: t.navigationEditor.title }} />

      <AppText variant="body" color="textSecondary">
        {t.navigationEditor.intro}
      </AppText>

      {/* Live preview of the tab bar */}
      <Section title={t.navigationEditor.preview}>
        <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {inBar.map((feature, index) => (
            <View key={feature.id} style={styles.previewItem}>
              <Icon
                name={index === 0 ? feature.iconActive : feature.icon}
                size={22}
                color={index === 0 ? 'primary' : 'textTertiary'}
              />
              <AppText
                variant="caption"
                color={index === 0 ? 'primary' : 'textTertiary'}
                numberOfLines={1}
                style={{ fontSize: 11, fontWeight: '600' }}>
                {t.features[feature.id].tabTitle}
              </AppText>
            </View>
          ))}
          <View style={styles.previewItem}>
            <Icon name="ellipsis-horizontal-circle-outline" size={22} color="textTertiary" />
            <AppText variant="caption" color="textTertiary" style={{ fontSize: 11, fontWeight: '600' }}>
              {t.more.tabTitle}
            </AppText>
          </View>
        </View>
      </Section>

      {/* Sections in the bar */}
      <Section title={t.navigationEditor.sectionInBar(inBar.length, MAX_TAB_BAR_ITEMS)}>
        {inBar.length === 0 ? (
          <Notice text={t.navigationEditor.emptyBar} />
        ) : (
          <Card style={{ gap: spacing.md }}>
            {inBar.map((feature, index) => (
              <View key={feature.id} style={{ gap: spacing.md }}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.row}>
                  <IconTile name={feature.icon} size={40} />
                  <AppText variant="headline" style={{ flex: 1 }} numberOfLines={1}>
                    {t.features[feature.id].title}
                  </AppText>
                  <RoundButton
                    icon="arrow-up"
                    label={t.navigationEditor.moveUp}
                    disabled={index === 0}
                    onPress={() => move(index, -1)}
                  />
                  <RoundButton
                    icon="arrow-down"
                    label={t.navigationEditor.moveDown}
                    disabled={index === inBar.length - 1}
                    onPress={() => move(index, 1)}
                  />
                  <RoundButton
                    icon="remove"
                    tone="danger"
                    label={t.navigationEditor.remove}
                    onPress={() => remove(feature.id)}
                  />
                </View>
              </View>
            ))}
          </Card>
        )}
      </Section>

      {/* Sections not in the bar */}
      {others.length > 0 ? (
        <Section
          title={t.navigationEditor.sectionOther}
          description={barIsFull ? t.navigationEditor.barFull : undefined}>
          <Card style={{ gap: spacing.md }}>
            {others.map((feature, index) => (
              <View key={feature.id} style={{ gap: spacing.md }}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.row}>
                  <IconTile name={feature.icon} size={40} />
                  <AppText variant="headline" style={{ flex: 1 }} numberOfLines={1}>
                    {t.features[feature.id].title}
                  </AppText>
                  <RoundButton
                    icon="add"
                    tone="primary"
                    label={t.navigationEditor.add}
                    disabled={barIsFull}
                    onPress={() => add(feature.id)}
                  />
                </View>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      <Button title={t.navigationEditor.reset} icon="refresh-outline" variant="ghost" onPress={resetToDefault} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 },
  roundButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  preview: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  previewItem: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 2 },
});
