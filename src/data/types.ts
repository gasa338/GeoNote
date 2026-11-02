/**
 * Data models used everywhere in the app.
 *
 * The central model is the **Zone**: a circle on the map plus what to remember
 * there (a note or a checklist) and how to remind you. (Older versions had
 * separate "places" and "reminders" — they are converted automatically,
 * see `data/zones.ts → migrateFromV1`.)
 *
 * Field names match the future Django models (camelCase here, snake_case on the
 * server — `data/api/mappers.ts` converts between the two).
 *
 * @module data/types
 * @category Data
 */

/** Every record has a UUID string id, created on the phone. */
export type ID = string;

/** What actually happened at a zone: the user arrived or left. */
export type ZoneEvent = 'enter' | 'exit';

/**
 * When the reminder fires: on entering the zone, on leaving it,
 * or on **both** (arriving and leaving each pop up).
 */
export type TriggerType = ZoneEvent | 'both';

/** `always` fires on every visit, `once` turns itself off after the first time. */
export type RepeatMode = 'always' | 'once';

/**
 * How the reminder gets your attention:
 * - `notification` — a normal pop-up with a short sound.
 * - `alarm` — rings like an alarm clock until you press "Stop".
 */
export type AlertStyle = 'notification' | 'alarm';

/** Zone type — sets the icon and color. Shown in "Additional options". */
export type ZoneKind = 'personal' | 'shopping' | 'task';

/** What the zone remembers: a free note or a checklist. */
export type ContentMode = 'note' | 'list';

/** One line in a zone's checklist (e.g. "milk"). */
export interface ChecklistItem {
  id: ID;
  text: string;
  done: boolean;
}

/** A zone: a place on the map + what to remember there + how to remind you. */
export interface Zone {
  id: ID;
  /** Name shown in the app, e.g. "Kalenić pijaca". */
  name: string;
  /** Human readable address (from reverse geocoding). May be missing. */
  address: string | null;
  latitude: number;
  longitude: number;
  /** Radius of the circle in meters (20 – 1000). */
  radius: number;
  kind: ZoneKind;
  contentMode: ContentMode;
  /** Free text (used when `contentMode` is `note`, also shown as a subtitle). */
  note: string;
  checklist: ChecklistItem[];
  trigger: TriggerType;
  repeat: RepeatMode;
  alertStyle: AlertStyle;
  /** Paused zones are not watched and never fire. */
  active: boolean;
  /** If true, every checklist item is un-ticked each time the zone fires. */
  resetChecklistOnTrigger: boolean;
  /** ISO date of the last time this zone fired, or null. */
  lastTriggeredAt: string | null;
  /**
   * Which event fired last time (`enter`/`exit`). Used with trigger `both`, so
   * leaving soon after arriving still pops up. Missing in old data.
   */
  lastTriggerEvent?: ZoneEvent | null;
  createdAt: string;
  updatedAt: string;
}

/** Fields the user fills in when creating or editing a zone. */
export type ZoneInput = Omit<Zone, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggeredAt' | 'lastTriggerEvent'>;

/** Languages the app supports. English is the default. */
export type Language = 'en' | 'sr';

/** Light or dark look. `system` follows the phone's setting. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** Accent colors the user can pick in Settings (see `theme/index.ts → ACCENTS`). */
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink';

/**
 * Id of one section (feature) of the app.
 * The full list with icons and routes is in `src/navigation/features.ts`.
 */
export type FeatureId = 'map' | 'zones' | 'places' | 'following' | 'events' | 'account' | 'settings';

/** App-wide settings saved on the phone. */
export interface AppSettings {
  language: Language;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  /** Sections shown in the bottom tab bar, in order. "More" is always added at the end. */
  tabBar: FeatureId[];
  /** True after the user finished the welcome screen once. */
  onboardingDone: boolean;
}
