/**
 * **Edit / delete a zone** — the same actions everywhere (zone details, the
 * "⋯" button in every zone row, the editor).
 *
 * Plain functions: they show a native dialog and call the store.
 *
 * @module features/zones/zoneActions
 * @category Feature: Zones
 */
import { router } from 'expo-router';
import { Alert } from 'react-native';

import type { Zone } from '@/data/types';
import type { Dictionary } from '@/i18n/en';
import { useAppStore } from '@/store/useAppStore';

/** Opens the zone editor for an existing zone. */
export function editZone(zoneId: string): void {
  router.push({ pathname: '/edit-zone/[id]', params: { id: zoneId } });
}

/**
 * Asks "Delete this zone?" and deletes it after the user confirms.
 *
 * @param afterDelete Runs after deleting (e.g. go back from the detail screen).
 */
export function confirmDeleteZone(zone: Zone, t: Dictionary, afterDelete?: () => void): void {
  Alert.alert(t.zoneEditor.deleteTitle, `${zone.name}\n${t.zoneEditor.deleteText}`, [
    { text: t.common.cancel, style: 'cancel' },
    {
      text: t.common.delete,
      style: 'destructive',
      onPress: async () => {
        await useAppStore.getState().deleteZone(zone.id);
        afterDelete?.();
      },
    },
  ]);
}

/**
 * The "⋯" menu of a zone row: Edit · Delete · Cancel.
 * (Android dialogs show at most three buttons.)
 */
export function openZoneMenu(zone: Zone, t: Dictionary): void {
  Alert.alert(zone.name, t.zones.options, [
    { text: t.common.cancel, style: 'cancel' },
    { text: t.common.delete, style: 'destructive', onPress: () => confirmDeleteZone(zone, t) },
    { text: t.common.edit, onPress: () => editZone(zone.id) },
  ]);
}
