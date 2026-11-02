/**
 * **New zone / Edit zone** (design: "Nova zona").
 *
 * Sections:
 * 1. Where — name + address (search icon looks the name up). The place is picked
 *    on the **big map behind the sheet**: tap the map or drag the pin. Drag the
 *    sheet down to see more map.
 * 2. Zone radius — slider 20 m … 1 km, "About 3 min walk".
 * 3. What to remember — Note or Task list.
 * 4. How to remind you — **Notification** or **Alarm** (cards with an icon).
 * 5. When — **On entering** · **On leaving** · **Both**.
 * 6. More options (collapsible) — zone type, how often, reset the list on every visit.
 * 7. "Delete zone" (only when editing).
 *
 * New zones start switched on; pausing is done on the zone details screen.
 * "Save zone" is fixed at the bottom.
 *
 * URL: `/edit-zone/new` or `/edit-zone/<id>`. A new zone can start from search
 * results: `?name=…&lat=…&lng=…`.
 *
 * @module features/zones/ZoneEditorScreen
 * @category Feature: Zones
 */
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetScreen } from '@/components/SheetScreen';
import type { WebMapProps } from '@/components/map/WebMap';
import { AppText, Button, Icon, Notice, SegmentedControl, TextField, type IconName } from '@/components/ui';
import type { AlertStyle, ChecklistItem, ContentMode, RepeatMode, TriggerType, ZoneKind } from '@/data/types';
import { emptyZoneInput } from '@/data/zones';
import { RELIABLE_BACKGROUND_RADIUS } from '@/geo/constants';
import { getLastPosition } from '@/geo/foregroundWatcher';
import { usePosition } from '@/hooks/usePosition';
import { useT } from '@/i18n/useT';
import { useAppStore, useZone } from '@/store/useAppStore';
import { radius as corner, spacing, typography, useTheme } from '@/theme';
import type { LatLng } from '@/utils/geo';
import { IS_EXPO_GO } from '@/utils/runtime';

import { ChecklistEditor } from './components/ChecklistEditor';
import { RadiusSlider } from './components/RadiusSlider';
import { confirmDeleteZone } from './zoneActions';
import { toMapZone, ZONE_KIND_ORDER, ZONE_KINDS } from './zoneVisuals';

/** Where the map starts when nothing else is known (Belgrade). */
const FALLBACK: LatLng = { latitude: 44.8125, longitude: 20.4612 };

/** Asks for location permission and returns the current position, or `null`. */
async function getCurrentLocation(): Promise<LatLng | null> {
  const watched = getLastPosition();
  if (watched) return { latitude: watched.coords.latitude, longitude: watched.coords.longitude };
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }));
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

/** Turns coordinates into a short address like "Maksima Gorkog 14, Beograd", or `null`. */
async function getAddress(point: LatLng): Promise<string | null> {
  try {
    const [result] = await Location.reverseGeocodeAsync(point);
    if (!result) return null;
    const street = [result.street, result.streetNumber].filter(Boolean).join(' ');
    const parts = [street || result.name, result.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}

/**
 * Waits until saved data is loaded, then shows the form (the form copies the
 * zone into its fields once, when it appears).
 */
export default function ZoneEditorScreen() {
  const loaded = useAppStore((state) => state.loaded);
  if (!loaded) return null;
  return <ZoneForm />;
}

/** A row of equal buttons, one selected (used for zone type). */
function OptionButtons<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[styles.optionButton, { backgroundColor: selected ? colors.primary : colors.surface }]}>
            {selected ? <Icon name="checkmark" size={16} color="onPrimary" /> : null}
            <AppText variant="button" color={selected ? 'onPrimary' : 'text'} style={{ fontSize: 15 }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Bigger choice cards with an icon and a short description, one selected
 * (used for "How to remind you" and "When").
 */
function OptionCards<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; description: string; icon: IconName }[];
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[
              styles.optionCard,
              {
                backgroundColor: selected ? colors.primarySoft : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}>
            <Icon name={option.icon} size={22} color={selected ? 'primary' : 'textSecondary'} />
            <AppText variant="button" color={selected ? 'primary' : 'text'} style={{ fontSize: 15 }} numberOfLines={1}>
              {option.label}
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ fontSize: 12 }} numberOfLines={2}>
              {option.description}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The editor form. */
function ZoneForm() {
  const t = useT();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id: string; name?: string; lat?: string; lng?: string }>();
  const isNew = params.id === 'new';
  const existing = useZone(isNew ? undefined : params.id);
  const saveZone = useAppStore((state) => state.saveZone);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const position = usePosition();
  const otherZones = useAppStore((state) => state.zones).filter((zone) => zone.id !== params.id);

  // ---- Form state (starts from the saved zone, or from defaults) --------------
  const start = existing ?? { ...emptyZoneInput(), name: params.name ?? '' };
  const startPoint =
    existing ? { latitude: existing.latitude, longitude: existing.longitude }
    : params.lat && params.lng ? { latitude: Number(params.lat), longitude: Number(params.lng) }
    : null;

  const [name, setName] = useState(start.name);
  const [address, setAddress] = useState<string | null>(start.address);
  const [point, setPoint] = useState<LatLng | null>(startPoint);
  const [zoneRadius, setZoneRadius] = useState(start.radius);
  const [kind, setKind] = useState<ZoneKind>(start.kind);
  const [contentMode, setContentMode] = useState<ContentMode>(start.contentMode);
  const [note, setNote] = useState(start.note);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(start.checklist);
  const [trigger, setTrigger] = useState<TriggerType>(start.trigger);
  const [repeat, setRepeat] = useState<RepeatMode>(start.repeat);
  const [alertStyle, setAlertStyle] = useState<AlertStyle>(start.alertStyle);
  /** On/off is not edited here (switch on the details screen); new zones start on. */
  const active = start.active;
  const [resetChecklist, setResetChecklist] = useState(start.resetChecklistOnTrigger);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Bumped to re-center the map (search, "my location"); tapping the map does not move the camera. */
  const [viewKey, setViewKey] = useState(0);

  // New zone without coordinates: start at the user's position.
  useEffect(() => {
    if (point) {
      if (isNew && !address) void getAddress(point).then(setAddress);
      return;
    }
    void (async () => {
      const here = await getCurrentLocation();
      setPoint(here ?? FALLBACK);
      setViewKey((key) => key + 1);
      if (here) setAddress(await getAddress(here));
    })();
    // Runs once when the form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Actions -----------------------------------------------------------------

  async function moveTo(newPoint: LatLng, recenter: boolean) {
    setPoint(newPoint);
    if (recenter) setViewKey((key) => key + 1);
    setAddress(await getAddress(newPoint));
  }

  async function searchAddress() {
    const query = name.trim();
    if (!query) return;
    setSearching(true);
    try {
      const [found] = await Location.geocodeAsync(query);
      if (found) await moveTo({ latitude: found.latitude, longitude: found.longitude }, true);
      else Alert.alert(t.zoneEditor.notFoundTitle, t.zoneEditor.notFoundText);
    } catch {
      Alert.alert(t.zoneEditor.searchFailedTitle, t.zoneEditor.searchFailedText);
    } finally {
      setSearching(false);
    }
  }

  async function goToMyLocation() {
    const here = await getCurrentLocation();
    if (here) await moveTo(here, true);
    else Alert.alert(t.zoneEditor.locationUnavailableTitle, t.zoneEditor.locationUnavailableText);
  }

  async function save() {
    if (!point) return;
    if (!name.trim()) {
      Alert.alert(t.zoneEditor.nameRequiredTitle, t.zoneEditor.nameRequiredText);
      return;
    }
    setSaving(true);
    try {
      const saved = await saveZone(
        {
          name: name.trim(),
          address,
          latitude: point.latitude,
          longitude: point.longitude,
          radius: zoneRadius,
          kind,
          contentMode,
          note: note.trim(),
          checklist,
          trigger,
          repeat,
          alertStyle,
          active,
          resetChecklistOnTrigger: resetChecklist,
        },
        isNew ? undefined : params.id,
      );
      if (isNew) router.replace({ pathname: '/zones/[id]', params: { id: saved.id } });
      else router.back();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (existing) confirmDeleteZone(existing, t, () => router.dismissTo('/zones'));
  }

  // ---- Screen --------------------------------------------------------------------

  if (!isNew && !existing) {
    return (
      <SheetScreen backLabel={t.zoneEditor.titleEdit} headerRight={null}>
        <AppText color="textSecondary">{t.zoneEditor.missing}</AppText>
      </SheetScreen>
    );
  }

  const cancel = (
    <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
      <AppText variant="button" color="primary">
        {t.common.cancel}
      </AppText>
    </Pressable>
  );

  // The big map behind the sheet is where the place is picked.
  const mapHeight = Math.round(windowHeight * 0.45);
  const mapPadding = { top: insets.top + 64, bottom: windowHeight - insets.top - mapHeight };
  const pickerMap: WebMapProps = {
    // Your other zones, so you can see where the new one sits next to them.
    zones: otherZones.map((zone) => ({ ...toMapZone(zone, colors.primary), active: false })),
    pin: point ? { lat: point.latitude, lng: point.longitude, radius: zoneRadius, icon: ZONE_KINDS[kind].icon, draggable: true } : null,
    user: position,
    showLabels: false,
    view: point
      ? { key: `pin-${viewKey}`, center: { lat: point.latitude, lng: point.longitude }, zoom: zoneRadius > 400 ? 14 : 16, padding: mapPadding }
      : { key: 'waiting', center: { lat: FALLBACK.latitude, lng: FALLBACK.longitude }, zoom: 13, padding: mapPadding },
    onPress: (tapped) => void moveTo(tapped, false),
  };

  return (
    <SheetScreen
      backLabel={isNew ? t.zoneEditor.titleNew : t.zoneEditor.titleEdit}
      headerRight={cancel}
      mapHeight={mapHeight}
      map={pickerMap}
      mapOverlay={
        <View style={styles.mapTools} pointerEvents="box-none">
          <View style={[styles.mapHint, { backgroundColor: colors.surface }]} pointerEvents="none">
            <Icon name="move-outline" size={14} color="primary" />
            <AppText variant="caption" style={{ fontWeight: '600', fontSize: 12 }}>
              {t.zoneEditor.movePin}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.zoneEditor.myLocation}
            onPress={() => void goToMyLocation()}
            style={[styles.locate, { backgroundColor: colors.surface }]}>
            <Icon name="locate" size={20} color="primary" />
          </Pressable>
        </View>
      }
      footer={<Button title={t.zoneEditor.save} icon="checkmark" loading={saving} disabled={!point} onPress={() => void save()} />}>
      {/* 1. Where */}
      <View style={{ gap: spacing.md }}>
        <AppText variant="headline">{t.zoneEditor.where}</AppText>
        <View style={[styles.placeBox, { borderColor: colors.border }]}>
          <Icon name="location-outline" size={22} color="primary" />
          <View style={{ flex: 1 }}>
            <TextInput
              value={name}
              onChangeText={setName}
              onSubmitEditing={() => void searchAddress()}
              returnKeyType="search"
              placeholder={t.zoneEditor.namePlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[typography.headline, { color: colors.text, paddingVertical: 2 }]}
            />
            {address ? (
              <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                {address}
              </AppText>
            ) : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t.zoneEditor.search} hitSlop={10} onPress={() => void searchAddress()}>
            {searching ? <ActivityIndicator color={colors.primary} /> : <Icon name="search" size={22} color="textSecondary" />}
          </Pressable>
        </View>

        <View style={styles.pickHint}>
          <Icon name="hand-left-outline" size={16} color="primary" />
          <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
            {t.zoneEditor.pickOnMap}
          </AppText>
        </View>
      </View>

      {/* 2. Radius */}
      <View style={{ gap: spacing.sm }}>
        <RadiusSlider value={zoneRadius} onChange={setZoneRadius} />
        {zoneRadius < RELIABLE_BACKGROUND_RADIUS ? <Notice tone="warning" text={t.zoneEditor.smallRadiusWarning} /> : null}
      </View>

      {/* 3. What to remember */}
      <View style={{ gap: spacing.md }}>
        <AppText variant="headline">{t.zoneEditor.whatToRemember}</AppText>
        <SegmentedControl
          value={contentMode}
          onChange={(value) => setContentMode(value as ContentMode)}
          options={[
            { value: 'note', label: t.zoneEditor.note },
            { value: 'list', label: t.zoneEditor.list },
          ]}
        />
        {contentMode === 'note' ? (
          <TextField value={note} onChangeText={setNote} placeholder={t.zoneEditor.notePlaceholder} multiline />
        ) : (
          <ChecklistEditor items={checklist} onChange={setChecklist} />
        )}
      </View>

      {/* 4. How to remind you */}
      <View style={{ gap: spacing.md }}>
        <AppText variant="headline">{t.zoneEditor.alert}</AppText>
        <OptionCards
          value={alertStyle}
          onChange={setAlertStyle}
          options={[
            { value: 'notification', label: t.zoneEditor.notification, description: t.zoneEditor.notificationDesc, icon: 'notifications-outline' },
            { value: 'alarm', label: t.zoneEditor.alarm, description: t.zoneEditor.alarmDesc, icon: 'alarm-outline' },
          ]}
        />
        {alertStyle === 'alarm' && IS_EXPO_GO ? <Notice tone="warning" text={t.zoneEditor.alarmExpoGo} /> : null}
      </View>

      {/* 5. When */}
      <View style={{ gap: spacing.md }}>
        <AppText variant="headline">{t.zoneEditor.when}</AppText>
        <OptionCards
          value={trigger}
          onChange={setTrigger}
          options={[
            { value: 'enter', label: t.zoneEditor.onEnter, description: t.zoneEditor.onEnterDesc, icon: 'enter-outline' },
            { value: 'exit', label: t.zoneEditor.onExit, description: t.zoneEditor.onExitDesc, icon: 'exit-outline' },
            { value: 'both', label: t.zoneEditor.onBoth, description: t.zoneEditor.onBothDesc, icon: 'swap-horizontal-outline' },
          ]}
        />
      </View>

      {/* 6. More options */}
      <View style={[styles.options, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: optionsOpen }}
          onPress={() => setOptionsOpen((open) => !open)}
          style={styles.optionsHeader}>
          <AppText variant="headline" style={{ flex: 1 }}>
            {t.zoneEditor.moreOptions}
          </AppText>
          <Icon name={optionsOpen ? 'chevron-up' : 'chevron-down'} size={20} color="primary" />
        </Pressable>

        {optionsOpen ? (
          <View style={{ gap: spacing.lg, paddingBottom: spacing.lg }}>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" color="textSecondary">
                {t.zoneEditor.zoneType}
              </AppText>
              <OptionButtons value={kind} onChange={setKind} options={ZONE_KIND_ORDER.map((value) => ({ value, label: t.kinds[value] }))} />
            </View>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" color="textSecondary">
                {t.zoneEditor.repeat}
              </AppText>
              <OptionButtons
                value={repeat}
                onChange={setRepeat}
                options={[
                  { value: 'always', label: t.zoneEditor.everyTime },
                  { value: 'once', label: t.zoneEditor.onlyOnce },
                ]}
              />
            </View>
            {contentMode === 'list' ? (
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" style={{ fontWeight: '600' }}>
                    {t.zoneEditor.resetList}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {t.zoneEditor.resetListHint}
                  </AppText>
                </View>
                <Switch
                  value={resetChecklist}
                  onValueChange={setResetChecklist}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {!isNew ? <Button title={t.zoneEditor.delete} icon="trash-outline" variant="danger" onPress={confirmDelete} /> : null}
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  optionCard: {
    flex: 1,
    gap: 4,
    padding: spacing.md,
    borderRadius: corner.md,
    borderWidth: 1.5,
  },
  placeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: corner.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pickHint: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mapTools: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: corner.pill,
  },
  locate: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: { borderRadius: corner.lg, borderWidth: StyleSheet.hairlineWidth * 2, paddingHorizontal: spacing.lg },
  optionsHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 54 },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: corner.md,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
