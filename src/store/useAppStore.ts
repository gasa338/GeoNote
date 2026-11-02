/**
 * The app's shared state (what the screens display), built with Zustand.
 *
 * How data flows:
 * 1. A screen calls an action, e.g. `saveZone(...)`.
 * 2. The action writes to phone storage (`src/data/*.ts`).
 * 3. The action reloads the lists, so every screen shows the new data.
 * 4. If zones changed, location tracking is refreshed.
 *
 * The background geofence task writes directly to storage (the app may be
 * closed then), so the root layout calls `reload()` whenever the app returns
 * to the foreground.
 *
 * Usage in a screen:
 * ```tsx
 * const zones = useAppStore((state) => state.zones);
 * const saveZone = useAppStore((state) => state.saveZone);
 * ```
 *
 * @module store/useAppStore
 * @category State
 */
import { create } from 'zustand';

import { addLogEntry } from '@/data/activityLog';
import * as settingsStorage from '@/data/settings';
import * as socialStorage from '@/data/social';
import type {
  AccentColor,
  AppSettings,
  ChecklistItem,
  FeatureId,
  ID,
  Language,
  ThemeMode,
  Zone,
  ZoneInput,
} from '@/data/types';
import * as zonesStorage from '@/data/zones';
import { getLastPosition } from '@/geo/foregroundWatcher';
import { refreshGeofences } from '@/geo/geofenceManager';
import { readGeofenceStatus, type GeofenceStatus } from '@/geo/geoState';
import { handleGeofenceEvent } from '@/geo/reminderEngine';
import { applyThemeMode } from '@/theme/applyThemeMode';
import { distanceMeters } from '@/utils/geo';

/** Everything the store holds, and every action screens can call. */
export interface AppState {
  /** All zones, newest first. */
  zones: Zone[];
  /** Language, theme, accent, tab bar layout and welcome flag. */
  settings: AppSettings;
  /** Followed places, saved and liked posts. */
  social: socialStorage.SocialState;
  /** True after the first `reload()` finished (avoids flashing empty screens). */
  loaded: boolean;
  /** Last known state of location tracking. */
  geofence: GeofenceStatus | null;

  /** Reads everything from storage. */
  reload: () => Promise<void>;
  /** Re-registers the zones the phone should watch. */
  syncGeofences: () => Promise<void>;

  /** Creates a zone (no `id`) or updates one (with `id`). */
  saveZone: (input: ZoneInput, id?: ID) => Promise<Zone>;
  deleteZone: (id: ID) => Promise<void>;
  /** Turns a zone on or off. */
  setZoneActive: (id: ID, active: boolean) => Promise<void>;
  /** Saves a changed checklist immediately (ticking items in the shop). */
  updateChecklist: (zoneId: ID, checklist: ChecklistItem[]) => Promise<void>;

  setLanguage: (language: Language) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;
  setAccentColor: (accentColor: AccentColor) => Promise<void>;
  /** Saves which sections appear in the bottom tab bar, in order. */
  setTabBar: (tabBar: FeatureId[]) => Promise<void>;
  /** Marks the welcome screen as seen. */
  finishOnboarding: () => Promise<void>;

  toggleFollow: (placeId: string) => Promise<void>;
  toggleSavedPost: (postId: string) => Promise<void>;
  toggleLikedPost: (postId: string) => Promise<void>;
}

/** Newest zones first. */
function sortZones(zones: Zone[]): Zone[] {
  return [...zones].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * If the user is standing inside a zone that was just saved (or switched on),
 * show its reminder right away — otherwise nothing would happen until the
 * user leaves and comes back, which feels broken.
 */
async function fireIfAlreadyInside(zone: Zone): Promise<void> {
  if (!zone.active || zone.trigger === 'exit') return; // 'enter' or 'both'
  const position = getLastPosition();
  if (!position) return;
  if (distanceMeters(position.coords, zone) > zone.radius) return;
  void addLogEntry('info', `${zone.name}: you are already inside — showing the reminder now.`);
  await handleGeofenceEvent(zone.id, 'enter', 'saved');
}

export const useAppStore = create<AppState>((set, get) => {
  /** Shared steps after any zone change. */
  async function afterZoneChange() {
    await get().reload();
    void get().syncGeofences(); // runs in the background, the screen does not wait
  }

  return {
    zones: [],
    settings: settingsStorage.DEFAULT_SETTINGS,
    social: socialStorage.DEFAULT_SOCIAL,
    loaded: false,
    geofence: null,

    reload: async () => {
      const zones = await zonesStorage.getAllZones();
      const settings = await settingsStorage.getSettings();
      const social = await socialStorage.getSocial();
      const geofence = await readGeofenceStatus();
      applyThemeMode(settings.themeMode);
      set({ zones: sortZones(zones), settings, social, geofence, loaded: true });
    },

    syncGeofences: async () => {
      const status = await refreshGeofences();
      set({ geofence: status });
    },

    saveZone: async (input, id) => {
      const zone = id ? await zonesStorage.updateZone(id, input) : await zonesStorage.createZone(input);
      await fireIfAlreadyInside(zone);
      await afterZoneChange();
      return zone;
    },

    deleteZone: async (id) => {
      await zonesStorage.deleteZone(id);
      await afterZoneChange();
    },

    setZoneActive: async (id, active) => {
      // Update the screen first so the switch reacts instantly, then save.
      set({ zones: get().zones.map((zone) => (zone.id === id ? { ...zone, active } : zone)) });
      const zone = await zonesStorage.updateZone(id, { active });
      if (active) await fireIfAlreadyInside(zone);
      await afterZoneChange();
    },

    updateChecklist: async (zoneId, checklist) => {
      set({ zones: get().zones.map((zone) => (zone.id === zoneId ? { ...zone, checklist } : zone)) });
      await zonesStorage.updateZone(zoneId, { checklist });
    },

    setLanguage: async (language) => {
      set({ settings: await settingsStorage.updateSettings({ language }) });
    },

    setThemeMode: async (themeMode) => {
      applyThemeMode(themeMode);
      set({ settings: await settingsStorage.updateSettings({ themeMode }) });
    },

    setAccentColor: async (accentColor) => {
      set({ settings: await settingsStorage.updateSettings({ accentColor }) });
    },

    setTabBar: async (tabBar) => {
      set({ settings: await settingsStorage.updateSettings({ tabBar }) });
    },

    finishOnboarding: async () => {
      set({ settings: await settingsStorage.updateSettings({ onboardingDone: true }) });
    },

    toggleFollow: async (placeId) => {
      const social = { ...get().social, followedPlaceIds: socialStorage.toggleId(get().social.followedPlaceIds, placeId) };
      set({ social });
      await socialStorage.saveSocial(social);
    },

    toggleSavedPost: async (postId) => {
      const social = { ...get().social, savedPostIds: socialStorage.toggleId(get().social.savedPostIds, postId) };
      set({ social });
      await socialStorage.saveSocial(social);
    },

    toggleLikedPost: async (postId) => {
      const social = { ...get().social, likedPostIds: socialStorage.toggleId(get().social.likedPostIds, postId) };
      set({ social });
      await socialStorage.saveSocial(social);
    },
  };
});

/** Returns one zone by id (or `undefined`). Re-renders when it changes. */
export function useZone(id?: ID): Zone | undefined {
  return useAppStore((state) => state.zones.find((zone) => zone.id === id));
}
