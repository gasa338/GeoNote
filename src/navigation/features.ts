/**
 * **The navigation registry** — the complete list of the app's sections.
 *
 * Every section (feature) is described once here: its id, the tab route that
 * shows it, its icon and whether it is ready or still being prepared.
 * The bottom tab bar, the "More" screen and "Organize navigation" are all
 * built from this list.
 *
 * Default bar (from the design): **Map · My zones · More**.
 *
 * ### Adding a new section (e.g. "Restaurants")
 * 1. Add `'restaurants'` to `FeatureId` in `src/data/types.ts`.
 * 2. Create `src/features/restaurants/RestaurantsScreen.tsx`
 *    (copy `src/features/events/EventsScreen.tsx` as a start).
 * 3. Create the route `src/app/(tabs)/restaurants.tsx` with one line:
 *    `export { default } from '@/features/restaurants/RestaurantsScreen';`
 * 4. Add an entry to {@link FEATURES} below.
 * 5. Add its texts under `features` in `src/i18n/en.ts` and `sr.ts`.
 *
 * @module navigation/features
 * @category Navigation
 */
import type { IconName } from '@/components/ui';
import type { FeatureId } from '@/data/types';

/** Everything the app needs to know about one section. */
export interface FeatureDefinition {
  id: FeatureId;
  /** File name of the tab route in `src/app/(tabs)/` (without `.tsx`). `index` = first screen. */
  tabName: string;
  /** Path used to open the section from anywhere, e.g. `/places`. */
  path: string;
  /** Icon in the tab bar and on the "More" screen. */
  icon: IconName;
  /** Icon when the tab is selected. */
  iconActive: IconName;
  /** `comingSoon` sections show a "Coming soon" label on the "More" screen. */
  status: 'ready' | 'comingSoon';
  /** Show this section as a row on the "More" screen. */
  showInMore: boolean;
}

/** All sections. The order is the order on the "More" screen. */
export const FEATURES: FeatureDefinition[] = [
  { id: 'map', tabName: 'index', path: '/', icon: 'map-outline', iconActive: 'map', status: 'ready', showInMore: false },
  { id: 'zones', tabName: 'zones', path: '/zones', icon: 'layers-outline', iconActive: 'layers', status: 'ready', showInMore: false },
  { id: 'places', tabName: 'places', path: '/places', icon: 'library-outline', iconActive: 'library', status: 'ready', showInMore: true },
  { id: 'following', tabName: 'following', path: '/following', icon: 'newspaper-outline', iconActive: 'newspaper', status: 'ready', showInMore: true },
  { id: 'events', tabName: 'events', path: '/events', icon: 'calendar-outline', iconActive: 'calendar', status: 'comingSoon', showInMore: true },
  { id: 'account', tabName: 'account', path: '/account', icon: 'person-outline', iconActive: 'person', status: 'ready', showInMore: true },
  { id: 'settings', tabName: 'settings', path: '/settings', icon: 'options-outline', iconActive: 'options', status: 'ready', showInMore: true },
];

/** File name of the "More" tab route. It is always the last tab. */
export const MORE_TAB_NAME = 'more';

/** How many sections fit in the tab bar next to "More" (4 + More = 5). */
export const MAX_TAB_BAR_ITEMS = 4;

/** Returns the definition of one section. */
export function getFeature(id: FeatureId): FeatureDefinition | undefined {
  return FEATURES.find((feature) => feature.id === id);
}

/**
 * Turns the saved tab bar setting into the list of sections to show.
 * Unknown ids and duplicates are skipped; the list is cut to {@link MAX_TAB_BAR_ITEMS}.
 */
export function getTabBarFeatures(tabBar: FeatureId[]): FeatureDefinition[] {
  const result: FeatureDefinition[] = [];
  for (const id of tabBar) {
    const feature = getFeature(id);
    if (feature && !result.includes(feature)) result.push(feature);
    if (result.length === MAX_TAB_BAR_ITEMS) break;
  }
  return result;
}

/** Sections that are not in the tab bar (reachable through "More"). */
export function getHiddenFeatures(tabBar: FeatureId[]): FeatureDefinition[] {
  const visible = getTabBarFeatures(tabBar);
  return FEATURES.filter((feature) => !visible.includes(feature));
}

/** True when the section has its own button in the tab bar (then its screen shows no "← More"). */
export function isInTabBar(tabBar: FeatureId[], id: FeatureId): boolean {
  return getTabBarFeatures(tabBar).some((feature) => feature.id === id);
}
