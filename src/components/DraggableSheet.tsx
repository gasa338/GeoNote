/**
 * @module components/DraggableSheet
 * @category App components
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

/** Props of {@link DraggableSheet}. */
export interface DraggableSheetProps {
  /**
   * Heights (in points) where the sheet stops, from low to high,
   * e.g. `[200, 420, 760]` = small · middle · almost full screen.
   */
  snapPoints: number[];
  /** Which snap point to start at (index into `snapPoints`). */
  initialSnap: number;
  /**
   * Optional animated value the sheet keeps equal to its height. Pass one to
   * move other things with the sheet (e.g. buttons that sit on top of it).
   */
  height?: Animated.Value;
  /** Content of the drag area under the handle (e.g. the title row). Dragging works here too. */
  header?: ReactNode;
  /** Fixed bar at the bottom of the sheet (e.g. "Save zone"). */
  footer?: ReactNode;
  /** The scrolling content. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** How fast a flick must be to jump to the next stop (points per ms). */
const FLICK_SPEED = 0.5;

/**
 * A bottom sheet the user can **drag up and down** to choose how much map and
 * how much content to see. It stops at the heights in `snapPoints`.
 *
 * - Drag the handle (or the header) up/down; a quick flick jumps to the next stop.
 * - Tap the handle to go to the next stop (and back to the first after the last).
 * - The content inside scrolls as usual.
 */
export function DraggableSheet({ snapPoints, initialSnap, height: externalHeight, header, footer, children, style }: DraggableSheetProps) {
  const { colors, shadows } = useTheme();
  const [ownHeight] = useState(() => new Animated.Value(snapPoints[initialSnap]));
  const height = externalHeight ?? ownHeight;

  // All drag logic is created once. `memory` holds values that change while dragging.
  const [sheet] = useState(() => createSheetController(height, snapPoints, initialSnap));

  // If the stops change (screen measured or rotated), stay on the same stop.
  // Compared as text, so a new array with the same numbers changes nothing.
  const snapKey = snapPoints.join(',');
  useEffect(() => {
    sheet.setSnapPoints(snapKey.split(',').map(Number));
  }, [snapKey, sheet]);

  return (
    <Animated.View style={[styles.sheet, { height, backgroundColor: colors.surface }, shadows.sheet, style]}>
      <View {...sheet.panResponder.panHandlers}>
        <Pressable onPress={sheet.cycle} accessibilityRole="adjustable" accessibilityLabel="Resize" style={styles.handleArea} hitSlop={4}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </Pressable>
        {header}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
      {footer}
    </Animated.View>
  );
}

/**
 * Creates the drag behaviour of one sheet: a PanResponder plus helpers.
 * Plain function (no React), so it is easy to read and reuse.
 */
function createSheetController(height: Animated.Value, initialSnaps: number[], initialSnap: number) {
  const memory = {
    snaps: initialSnaps,
    current: initialSnap,
    /** Sheet height when the finger touched down. */
    start: initialSnaps[initialSnap],
  };

  /** Animates to one stop. */
  function snapTo(index: number) {
    const target = Math.max(0, Math.min(index, memory.snaps.length - 1));
    memory.current = target;
    Animated.spring(height, { toValue: memory.snaps[target], useNativeDriver: false, bounciness: 4, speed: 14 }).start();
  }

  /** Tapping the handle walks through the stops (back to the first after the last). */
  function cycle() {
    snapTo(memory.current >= memory.snaps.length - 1 ? 0 : memory.current + 1);
  }

  function setSnapPoints(snaps: number[]) {
    memory.snaps = snaps;
    memory.current = Math.min(memory.current, snaps.length - 1);
    height.setValue(snaps[memory.current]);
  }

  const panResponder = PanResponder.create({
    // Start dragging only on a clear vertical move (taps still work).
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderGrant: () => {
      height.stopAnimation((value) => {
        memory.start = value;
      });
    },
    onPanResponderMove: (_, gesture) => {
      const next = memory.start - gesture.dy; // dragging up = taller
      height.setValue(Math.max(memory.snaps[0], Math.min(next, memory.snaps[memory.snaps.length - 1])));
    },
    onPanResponderRelease: (_, gesture) => {
      // Go to the stop nearest to where the finger let go…
      const released = memory.start - gesture.dy;
      let nearest = 0;
      memory.snaps.forEach((snap, index) => {
        if (Math.abs(snap - released) < Math.abs(memory.snaps[nearest] - released)) nearest = index;
      });
      // …but a quick short flick still moves at least one stop.
      if (nearest === memory.current && gesture.vy < -FLICK_SPEED) nearest = memory.current + 1;
      if (nearest === memory.current && gesture.vy > FLICK_SPEED) nearest = memory.current - 1;
      snapTo(nearest);
    },
    onPanResponderTerminate: () => snapTo(memory.current),
  });

  return { panResponder, cycle, setSnapPoints };
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: 'hidden',
  },
  handleArea: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.md },
  handle: { width: 40, height: 5, borderRadius: 3 },
});
