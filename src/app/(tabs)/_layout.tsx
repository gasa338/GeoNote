/**
 * **Bottom tab bar** — built from the user's settings (design: Map · My zones · More).
 *
 * - Which sections appear, and in which order, comes from `settings.tabBar`
 *   (Settings → Organize navigation).
 * - Sections not chosen still exist as routes but have no button in the bar;
 *   they open from "More", and the tab bar stays visible.
 * - "My zones" and "Places" are small stacks (list + details), so the tab bar
 *   stays visible on zone details and place profiles, like in the design.
 * - "More" is always the last tab.
 *
 * Also sends first-time users to the welcome screen.
 *
 * @module app/(tabs)/_layout
 * @category Navigation
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import type { IconName } from '@/components/ui';
import { useT } from '@/i18n/useT';
import { getHiddenFeatures, getTabBarFeatures, MORE_TAB_NAME } from '@/navigation/features';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme';

/** Returns a tab icon: filled when selected, outline otherwise. */
function tabIcon(filled: IconName, outline: IconName) {
  return function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Ionicons name={focused ? filled : outline} size={24} color={color as string} />;
  };
}

export default function TabsLayout() {
  const t = useT();
  const { colors } = useTheme();
  const loaded = useAppStore((state) => state.loaded);
  const settings = useAppStore((state) => state.settings);

  // First start: show the welcome screen once.
  if (loaded && !settings.onboardingDone) return <Redirect href="/welcome" />;

  const visibleFeatures = getTabBarFeatures(settings.tabBar);
  const hiddenFeatures = getHiddenFeatures(settings.tabBar);

  return (
    <Tabs
      // Re-create the navigator when the layout changes, so the new order applies immediately.
      key={visibleFeatures.map((feature) => feature.id).join(',')}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        // Leaving a tab resets its small stack (e.g. "My zones" shows the list again, not an old detail).
        popToTopOnBlur: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      {/* 1. Sections chosen for the bar, in the chosen order */}
      {visibleFeatures.map((feature) => (
        <Tabs.Screen
          key={feature.id}
          name={feature.tabName}
          options={{ title: t.features[feature.id].tabTitle, tabBarIcon: tabIcon(feature.iconActive, feature.icon) }}
        />
      ))}

      {/* 2. All other sections: they exist, but have no button in the bar.
            (Not `href: null` — in Expo Router 58 that also makes the screen unreachable.) */}
      {hiddenFeatures.map((feature) => (
        <Tabs.Screen
          key={feature.id}
          name={feature.tabName}
          options={{ title: t.features[feature.id].title, tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
        />
      ))}

      {/* 3. "More" — always last */}
      <Tabs.Screen
        name={MORE_TAB_NAME}
        options={{ title: t.more.tabTitle, tabBarIcon: tabIcon('ellipsis-horizontal', 'ellipsis-horizontal') }}
      />
    </Tabs>
  );
}
