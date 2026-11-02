/**
 * Icon and color of each **zone type** (Personal / Shopping / Errand), plus
 * small helpers for showing a zone. Change the look of a type here.
 *
 * @module features/zones/zoneVisuals
 * @category Feature: Zones
 */
import type { IconName } from '@/components/ui';
import type { Zone, ZoneKind } from '@/data/types';
import type { MapZone } from '@/components/map/WebMap';
import type { Dictionary } from '@/i18n/en';

/** Icon (Ionicons) and color for every zone type. `color: null` = use the accent color. */
export const ZONE_KINDS: Record<ZoneKind, { icon: IconName; color: string | null }> = {
  personal: { icon: 'person-outline', color: '#7457D3' },
  shopping: { icon: 'basket-outline', color: null },
  task: { icon: 'checkbox-outline', color: '#2E8A6C' },
};

/** Order of the types in the editor. */
export const ZONE_KIND_ORDER: ZoneKind[] = ['personal', 'shopping', 'task'];

/** The color of a zone (its type color, or the accent color). */
export function zoneColor(zone: Pick<Zone, 'kind'>, accent: string): string {
  return ZONE_KINDS[zone.kind].color ?? accent;
}

/** Converts a zone into what the map draws. */
export function toMapZone(zone: Zone, accent: string): MapZone {
  return {
    id: zone.id,
    lat: zone.latitude,
    lng: zone.longitude,
    radius: zone.radius,
    label: zone.name,
    icon: ZONE_KINDS[zone.kind].icon,
    color: zoneColor(zone, accent),
    active: zone.active,
  };
}

/** How many checklist items are not done yet. */
export function openItemCount(zone: Zone): number {
  return zone.checklist.filter((item) => !item.done).length;
}

/**
 * Second line under a zone name, like in the design:
 * "Shopping · 3 items left" or the first line of the note.
 */
export function zoneSubtitle(zone: Zone, t: Dictionary): string {
  if (zone.contentMode === 'list' && zone.checklist.length > 0) {
    const left = openItemCount(zone);
    return `${t.kinds[zone.kind]} · ${left > 0 ? t.zoneRow.itemsLeft(left) : t.zoneRow.allDone}`;
  }
  const firstLine = zone.note.split('\n')[0]?.trim();
  return firstLine || t.kinds[zone.kind];
}

/** Walking minutes for a distance (about 80 m per minute), at least 1. */
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 80));
}
