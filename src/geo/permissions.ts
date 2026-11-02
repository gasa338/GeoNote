/**
 * Location and notification **permissions**: reading their state and asking for them.
 *
 * Three permissions matter:
 * - **Location (while using)** — map, picking places, Expo Go test mode.
 * - **Location (all the time)** — real background geofencing. Not available in Expo Go.
 * - **Notifications** — so reminders can pop up.
 *
 * @module geo/permissions
 * @category Location
 */
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import { IS_EXPO_GO } from '@/utils/runtime';

/** Simplified permission status. */
export type PermStatus = 'granted' | 'denied' | 'undetermined';

/** The state of all permissions the app needs. */
export interface PermissionState {
  /** Location while the app is in use. */
  foreground: PermStatus;
  /** Location all the time (background). Always `undetermined` in Expo Go. */
  background: PermStatus;
  notifications: PermStatus;
  /** False if location is switched off for the whole phone. */
  locationServicesOn: boolean;
}

/** Converts Expo's status text to our three values. */
function toPermStatus(status: string): PermStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

/** Reads the current state of all permissions (does not ask the user). */
export async function getPermissionState(): Promise<PermissionState> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const notifications = await Notifications.getPermissionsAsync();

  let backgroundStatus = 'undetermined';
  if (!IS_EXPO_GO) {
    try {
      backgroundStatus = (await Location.getBackgroundPermissionsAsync()).status;
    } catch {
      backgroundStatus = 'undetermined';
    }
  }

  let locationServicesOn = true;
  try {
    locationServicesOn = await Location.hasServicesEnabledAsync();
  } catch {
    locationServicesOn = true;
  }

  return {
    foreground: toPermStatus(foreground.status),
    background: toPermStatus(backgroundStatus),
    notifications: toPermStatus(notifications.status),
    locationServicesOn,
  };
}

/** Asks for location while the app is in use. */
export async function requestForegroundLocation(): Promise<PermStatus> {
  const result = await Location.requestForegroundPermissionsAsync();
  return toPermStatus(result.status);
}

/**
 * Asks for location all the time. Must come after the "while in use" permission.
 * - Android 11+ opens the system settings where the user picks "Allow all the time".
 * - iOS may ask for "Always" later, after the app has used location for a while.
 */
export async function requestBackgroundLocation(): Promise<PermStatus> {
  const foreground = await requestForegroundLocation();
  if (foreground !== 'granted') return foreground;
  const result = await Location.requestBackgroundPermissionsAsync();
  return toPermStatus(result.status);
}

/** Asks for notification permission. */
export async function requestNotifications(): Promise<PermStatus> {
  const result = await Notifications.requestPermissionsAsync();
  return toPermStatus(result.status);
}

/**
 * Asks for everything the app needs, one after another.
 * In Expo Go "all the time" location is not possible, so only "while in use" is requested.
 */
export async function requestAllPermissions(): Promise<PermissionState> {
  await requestNotifications();
  if (IS_EXPO_GO) {
    await requestForegroundLocation();
  } else {
    await requestBackgroundLocation();
  }
  return getPermissionState();
}

/** Opens this app's page in the phone settings. */
export function openAppSettings(): Promise<void> {
  return Linking.openSettings();
}
