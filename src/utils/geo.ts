/**
 * Small math and formatting helpers for coordinates and distances.
 *
 * @module utils/geo
 * @category Utilities
 */

/** A point on the map. */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Earth radius in meters (used by {@link distanceMeters}). */
const EARTH_RADIUS_M = 6371000;

/** Converts degrees to radians. */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Distance between two points in meters (Haversine formula).
 * Accurate enough for distances from a few meters up to hundreds of kilometers.
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Formats a distance: `"85 m"`, `"1.2 km"`, `"14 km"`. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** Formats a radius option: `"50 m"`, `"1 km"`. */
export function formatRadius(meters: number): string {
  return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
}
