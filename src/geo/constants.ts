/**
 * Numbers and names used by location tracking. Change them here, in one place.
 *
 * @module geo/constants
 * @category Location
 */
import { Platform } from 'react-native';

/** Name of the background task the operating system wakes up on geofence events. */
export const GEOFENCE_TASK = 'geonote-geofence-task';

/**
 * Identifier of the helper circle around the user.
 * When the user leaves it, we pick the nearest places again
 * (only used when there are more places than {@link MAX_REGIONS}).
 */
export const REFRESH_REGION_ID = '__geonote_refresh__';

/**
 * How many circles the phone can watch at once.
 * iOS allows 20 per app, Android about 100 — we keep a small margin.
 */
export const MAX_REGIONS = Platform.OS === 'ios' ? 20 : 95;

/** Smallest radius the user can choose (meters). */
export const MIN_RADIUS = 20;

/**
 * Below this radius, background tracking (real build) becomes unreliable,
 * because the phone does not keep GPS on all the time. The editor shows a hint.
 */
export const RELIABLE_BACKGROUND_RADIUS = 100;

/** Radius selected for a new place (meters). */
export const DEFAULT_RADIUS = 150;

/** Radius options shown in the place editor (meters). */
export const RADIUS_OPTIONS = [20, 50, 100, 150, 250, 500, 1000];

/** The same reminder never fires more often than this (GPS can "jump" around the edge). */
export const TRIGGER_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Right after places are registered, Android and iOS immediately report the
 * **current state** of every place ("you are inside" / "you are outside").
 * Those reports are not real arrivals or departures, so during this time window
 * we only remember the state and show no notification. Without this, reminders
 * (and their sound) would fire every time the app is opened.
 */
export const INITIAL_STATE_WINDOW_MS = 60 * 1000; // 1 minute

/** If we never got an "exit" event for this long, we assume we missed it. */
export const INSIDE_STALE_MS = 24 * 60 * 60 * 1000; // 24 hours
