/**
 * @module components/SheetScreen
 * @category App components
 */
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toMapZone } from '@/features/zones/zoneVisuals';
import { useArea } from '@/hooks/useArea';
import { usePosition } from '@/hooks/usePosition';
import { useT } from '@/i18n/useT';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing, useTheme } from '@/theme';

import { DraggableSheet } from './DraggableSheet';
import { WebMap, type WebMapProps } from './map/WebMap';
import { AppText, Icon } from './ui';

/** Props of {@link SheetScreen}. */
export interface SheetScreenProps {
  /**
   * Text next to the back arrow, e.g. "More". No back button when missing —
   * unless the screen was opened with a `from` param (then the label is "Back").
   */
  backLabel?: string;
  /** What the back arrow does (default: go back). */
  onBack?: () => void;
  /** Anything at the top-left instead of a back button (e.g. the logo). */
  headerLeft?: ReactNode;
  /** Element at the top-right (default: the neighbourhood chip). */
  headerRight?: ReactNode;
  /** Height of the map area above the sheet. Default 150. */
  mapHeight?: number;
  /** Custom map (zone detail). Default: a still map around the user with all zones. */
  map?: WebMapProps;
  /** A photo instead of the map (place profile). The back button turns white. */
  cover?: ImageSourcePropType;
  /** Extra element over the map, at its bottom-left (e.g. "240 m from you"). */
  mapOverlay?: ReactNode;
  /** Fixed bar under the sheet content (e.g. "Save zone"). */
  footer?: ReactNode;
  children: ReactNode;
}

/** The small "📍 Vračar" chip shown at the top-right of most screens. */
export function AreaChip() {
  const { colors } = useTheme();
  const area = useArea(usePosition());
  if (!area) return null;
  return (
    <View style={[styles.chip, { backgroundColor: colors.surface }]}>
      <Icon name="location" size={14} color="primary" />
      <AppText variant="caption" style={{ fontWeight: '600' }}>
        {area}
      </AppText>
    </View>
  );
}

/**
 * The layout used by most screens in the design: a map at the top and a white
 * **sheet** with rounded corners over it, holding the content.
 *
 * The sheet can be **dragged up and down** (see `DraggableSheet`): down to see
 * more map, up to see more content. It starts at the height from the design.
 *
 * ```
 * ┌───────────────────────┐
 * │ (← More)       📍 Area │  ← header over the map (back button = white pill)
 * │        (map)          │
 * ╭───────────────────────╮
 * │        ───            │  ← sheet handle
 * │  content (scrolls)    │
 * │                       │
 * ├───────────────────────┤
 * │  footer (optional)    │
 * └───────────────────────┘
 * ```
 *
 * **Back button.** Shown when `backLabel` is set. A screen opened with
 * `?from=<route>` (e.g. zone details opened from the map with `from: '/'`)
 * always gets one, and it returns exactly there.
 */
export function SheetScreen({
  backLabel,
  onBack,
  headerLeft,
  headerRight,
  mapHeight = 150,
  map,
  cover,
  mapOverlay,
  footer,
  children,
}: SheetScreenProps) {
  const t = useT();
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const backText = backLabel ?? (from ? t.common.back : undefined);
  const { height: windowHeight } = useWindowDimensions();
  const zones = useAppStore((state) => state.zones);
  const position = usePosition();

  // Default background map: the user's surroundings with their zones.
  const backgroundMap: WebMapProps = map ?? {
    zones: zones.map((zone) => toMapZone(zone, colors.primary)),
    user: position,
    showLabels: false,
    view: position
      ? { key: 'user', center: { lat: position.latitude, lng: position.longitude }, zoom: 15 }
      : { key: 'default', center: { lat: 44.8, lng: 20.47 }, zoom: 14 },
  };

  function goBack() {
    if (onBack) onBack();
    else if (from) router.navigate(from as Href);
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  // The screen's real height (inside the tab bar), measured once it is shown.
  const [screenHeight, setScreenHeight] = useState(windowHeight);
  const topHeight = insets.top + mapHeight;

  // Where the sheet can stop: low (more map) · default (like the design) · almost full screen.
  const defaultHeight = Math.max(screenHeight - topHeight, 200);
  const hasOverlay = Boolean(mapOverlay);
  const snapPoints = useMemo(() => {
    const low = Math.min(Math.round(screenHeight * 0.32), defaultHeight);
    // Tall stop: leave room for the header (and the chip over the map, if any).
    const high = Math.max(screenHeight - insets.top - (hasOverlay ? 110 : 60), defaultHeight);
    return [low, defaultHeight, high];
  }, [screenHeight, defaultHeight, insets.top, hasOverlay]);
  const [sheetHeight] = useState(() => new Animated.Value(defaultHeight));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={(event) => setScreenHeight(event.nativeEvent.layout.height)}>
      {/* Map (or photo) fills the screen behind the sheet — drag the sheet down to see more of it. */}
      {cover ? (
        <Image source={cover} style={[styles.map, { height: screenHeight * 0.7 }]} resizeMode="cover" />
      ) : (
        <WebMap {...backgroundMap} style={[styles.map, { height: screenHeight }]} />
      )}

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        {backText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backText}
            onPress={goBack}
            hitSlop={10}
            style={({ pressed }) => [styles.back, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }, shadows.floating]}>
            <Icon name="arrow-back" size={22} color="text" />
            <AppText variant="headline" numberOfLines={1} style={{ fontWeight: '500', fontSize: 16, flexShrink: 1 }}>
              {backText}
            </AppText>
          </Pressable>
        ) : (
          (headerLeft ?? <View />)
        )}
        {headerRight === undefined ? <AreaChip /> : headerRight}
      </View>

      {mapOverlay ? (
        <Animated.View style={[styles.mapOverlay, { bottom: Animated.add(sheetHeight, 12) }]} pointerEvents="box-none">
          {mapOverlay}
        </Animated.View>
      ) : null}

      <DraggableSheet
        snapPoints={snapPoints}
        initialSnap={1}
        height={sheetHeight}
        footer={
          footer ? (
            <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
              {footer}
            </View>
          ) : undefined
        }>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl, gap: spacing.section }}>
          {children}
        </ScrollView>
      </DraggableSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    zIndex: 2,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    maxWidth: '70%',
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    borderRadius: radius.pill,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  mapOverlay: { position: 'absolute', left: spacing.screen, right: spacing.screen, zIndex: 2 },
  footer: { paddingHorizontal: spacing.screen, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
