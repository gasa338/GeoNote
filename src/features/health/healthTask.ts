/**
 * The **periodic background check** (about every hour, when the phone allows it).
 *
 * ⚠️ Imported at the top of `src/app/_layout.tsx` (right after the geofence
 * task), because the phone may start the app in the background only to run it.
 *
 * Android runs it with WorkManager; the phone decides the exact time and may
 * delay it a lot in battery-saving mode — which is exactly what the watchdog
 * in `healthCheck.ts` detects.
 *
 * @module features/health/healthTask
 * @category Feature: Health
 */
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { IS_EXPO_GO } from '@/utils/runtime';

import { runHealthCheck } from './healthCheck';
import { HEALTH_CONFIG } from './healthConfig';

TaskManager.defineTask(HEALTH_CONFIG.taskName, async () => {
  try {
    await runHealthCheck('background-check');
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.warn('[health-task] failed', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Registers the periodic check (once; the phone remembers it). Not in Expo Go. */
export async function registerHealthTask(): Promise<void> {
  if (IS_EXPO_GO) return;
  if (await TaskManager.isTaskRegisteredAsync(HEALTH_CONFIG.taskName)) return;
  await BackgroundTask.registerTaskAsync(HEALTH_CONFIG.taskName, { minimumInterval: HEALTH_CONFIG.checkIntervalMinutes });
}
