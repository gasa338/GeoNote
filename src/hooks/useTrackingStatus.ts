/**
 * @module hooks/useTrackingStatus
 * @category Hooks
 */
import type { IconName } from '@/components/ui';
import type { HealthReport } from '@/features/health/healthState';
import { useHealth } from '@/features/health/useHealth';
import type { PermissionState } from '@/geo/permissions';
import type { GeofenceStatus } from '@/geo/geoState';
import { useT } from '@/i18n/useT';
import { useAppStore } from '@/store/useAppStore';
import { IS_EXPO_GO } from '@/utils/runtime';

import { usePermissions } from './usePermissions';

/** One line that answers "do my reminders work right now?". */
export interface TrackingStatus {
  /** True = everything fine (green), false = the user should fix something. */
  ok: boolean;
  icon: IconName;
  text: string;
}

/**
 * Checks permissions and tracking in order of importance and returns one line
 * for the bottom of the map ("Location is on · Reminders work in the background")
 * or the first problem to fix. `null` while permissions are being read.
 */
export function useTrackingStatus(): TrackingStatus | null {
  const t = useT();
  const { permissions } = usePermissions();
  const geofence = useAppStore((state) => state.geofence);
  const health = useHealth();
  if (!permissions) return null;
  return describeStatus(permissions, geofence, t.status, health?.report);
}

/** The decision itself (kept separate so it is easy to read and test). */
export function describeStatus(
  permissions: PermissionState,
  geofence: GeofenceStatus | null,
  texts: ReturnType<typeof useT>['status'],
  health?: HealthReport | null,
): TrackingStatus {
  if (!permissions.locationServicesOn) return { ok: false, icon: 'location-outline', text: texts.locationOff };
  if (permissions.foreground !== 'granted') return { ok: false, icon: 'location-outline', text: texts.noLocation };
  if (permissions.notifications !== 'granted') return { ok: false, icon: 'notifications-off-outline', text: texts.noNotifications };
  if (!IS_EXPO_GO && permissions.background !== 'granted') return { ok: false, icon: 'navigate-outline', text: texts.needsAlways };
  if (geofence?.state === 'error') return { ok: false, icon: 'warning-outline', text: texts.error };
  // Everything allowed, but the app health check found the phone holding GeoNote back (battery, sleep…).
  if (health && health.problems.length > 0) return { ok: false, icon: 'battery-half-outline', text: texts.mayBeLate };
  return { ok: true, icon: 'shield-checkmark-outline', text: IS_EXPO_GO ? texts.okWhileOpen : texts.ok };
}
