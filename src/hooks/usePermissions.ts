/**
 * @module hooks/usePermissions
 * @category Hooks
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getPermissionState, type PermissionState } from '@/geo/permissions';

/**
 * Returns the current permission state and keeps it fresh.
 *
 * It re-reads the permissions when:
 * - the screen comes into view,
 * - the user returns to the app (e.g. after changing permissions in phone settings).
 *
 * `permissions` is `null` until the first read finishes.
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState | null>(null);

  const refresh = useCallback(async () => {
    const state = await getPermissionState();
    setPermissions(state);
    return state;
  }, []);

  // When the screen is shown.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  // When the app comes back from the background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return { permissions, refresh };
}
