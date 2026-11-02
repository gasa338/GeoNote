/**
 * @module hooks/useArea
 * @category Hooks
 */
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { LatLng } from '@/utils/geo';

/** Last result, so every screen does not look it up again. */
let cached: { key: string; name: string } | null = null;

/** Rounds a point to about 500 m, so small movements do not cause new lookups. */
function areaKey(point: LatLng): string {
  return `${point.latitude.toFixed(2)},${point.longitude.toFixed(2)}`;
}

/**
 * The name of the neighbourhood around a point (e.g. "Vračar"), for the small
 * chip at the top of the screens. Falls back to the city name.
 * Returns `null` until known.
 */
export function useArea(point: LatLng | null): string | null {
  const [name, setName] = useState<string | null>(cached?.name ?? null);

  useEffect(() => {
    if (!point) return;
    const key = areaKey(point);
    if (cached?.key === key) return; // already known (the state started from the cache)
    let cancelled = false;
    Location.reverseGeocodeAsync(point)
      .then(([result]) => {
        const found = result?.district || result?.subregion || result?.city || null;
        if (found && !cancelled) {
          cached = { key, name: found };
          setName(found);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [point]);

  return name;
}
