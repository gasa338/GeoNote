/**
 * @module features/zones/components/ZoneRow
 * @category Feature: Zones
 */
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Icon, IconTile } from "@/components/ui";
import type { Zone } from "@/data/types";
import { useT } from "@/i18n/useT";
import { spacing, useTheme } from "@/theme";
import { distanceMeters, formatDistance, type LatLng } from "@/utils/geo";

import { openZoneMenu } from "../zoneActions";
import { ZONE_KINDS, zoneColor, zoneSubtitle } from "../zoneVisuals";

/** Props of {@link ZoneRow}. */
export interface ZoneRowProps {
  zone: Zone;
  /** The user's position, for the distance on the right (optional). */
  position: LatLng | null;
  onPress: () => void;
  /** Show the "⋯" button (Edit · Delete). Default true. */
  showMenu?: boolean;
}

/**
 * One zone in a list (design: "Tvoja mesta"):
 * type icon · name · subtitle · distance · status ("In zone" / "Active" / "Paused") · "⋯".
 *
 * Tap the row → zone details. Tap "⋯" (or long-press the row) → Edit / Delete.
 */
export function ZoneRow({
  zone,
  position,
  onPress,
  showMenu = true,
}: ZoneRowProps) {
  const t = useT();
  const { colors } = useTheme();
  const color = zoneColor(zone, colors.primary);

  const distance = position ? distanceMeters(position, zone) : null;
  const isInside = distance !== null && distance <= zone.radius;

  let statusText = t.zoneRow.paused;
  let statusColor = colors.textTertiary;
  if (zone.active && isInside) {
    statusText = t.zoneRow.inZone;
    statusColor = colors.primary;
  } else if (zone.active) {
    statusText = t.zoneRow.active;
    statusColor = colors.success;
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={zone.name}
        onPress={onPress}
        onLongPress={showMenu ? () => openZoneMenu(zone, t) : undefined}
        style={({ pressed }) => [
          styles.row,
          { opacity: pressed ? 0.6 : zone.active ? 1 : 0.65 },
        ]}
      >
        <IconTile name={ZONE_KINDS[zone.kind].icon} color={color} size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="headline" numberOfLines={1}>
            {zone.name}
          </AppText>
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {zoneSubtitle(zone, t)}
          </AppText>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          {distance !== null ? (
            <AppText
              variant="headline"
              color="primary"
              style={{ fontSize: 15 }}
            >
              {formatDistance(distance)}
            </AppText>
          ) : null}
          <View style={styles.status}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <AppText
              variant="caption"
              color="textSecondary"
              style={{ fontSize: 12 }}
            >
              {statusText}
            </AppText>
          </View>
        </View>
      </Pressable>
      {showMenu ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.zones.options}
          onPress={() => openZoneMenu(zone, t)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.menu,
            { backgroundColor: pressed ? colors.surfaceMuted : "transparent" },
          ]}
        >
          <Icon name="ellipsis-vertical" size={18} color="textSecondary" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center" },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  menu: {
    width: 36,
    height: 44,
    marginRight: -spacing.sm,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  status: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
