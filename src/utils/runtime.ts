/**
 * @module utils/runtime
 * @category Utilities
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * `true` when the app runs inside the **Expo Go** app (development / testing).
 *
 * Expo Go cannot track location in the background, so the app then switches to
 * "test mode": location is followed only while the app is open
 * (see `geo/foregroundWatcher.ts`). In a real build (APK) this is `false` and
 * real background geofencing is used.
 */
export const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** App version from `app.config.ts`, e.g. `"1.0.0"`. */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
