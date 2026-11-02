/**
 * @module hooks/usePosition
 * @category Hooks
 */
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { getLastPosition, subscribeToPosition } from '@/geo/foregroundWatcher';
import type { LatLng } from '@/utils/geo';

/** Converts an Expo position to a plain point. */
function toPoint(position: Location.LocationObject): LatLng {
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

/**
 * The user's current position (updates as they move), or `null` while unknown.
 *
 * Uses the position the GPS watcher already follows (no extra GPS work). Until
 * the first fix arrives, the phone's last known position is used.
 */
export function usePosition(): LatLng | null {
  const [point, setPoint] = useState<LatLng | null>(() => {
    const last = getLastPosition();
    return last ? toPoint(last) : null;
  });

  useEffect(() => {
    let cancelled = false;
    if (!getLastPosition()) {
      Location.getLastKnownPositionAsync()
        .then((last) => {
          if (last && !cancelled) setPoint((current) => current ?? toPoint(last));
        })
        .catch(() => undefined);
    }
    const stop = subscribeToPosition((position) => setPoint(toPoint(position)));
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return point;
}
