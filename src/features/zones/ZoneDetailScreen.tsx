/**
 * **Zone details** (design: "Detalj zone").
 *
 * Map with the zone and "240 m from you · 4 min walk", the name, type, address,
 * radius and trigger, the checklist "Do on the way" (ticking saves at once) or
 * the note, the on/off card, "Show the way" (opens Google Maps walking directions),
 * and the buttons **Edit zone** / **Delete zone**. The back arrow (top left)
 * returns to where you came from (map or list).
 *
 * Route: `src/app/(tabs)/zones/[id].tsx` (inside the "My zones" tab, so the tab bar stays visible).
 *
 * @module features/zones/ZoneDetailScreen
 * @category Feature: Zones
 */
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { SheetScreen } from '@/components/SheetScreen';
import { AppText, Button, Icon, Pill } from '@/components/ui';
import { usePosition } from '@/hooks/usePosition';
import { useT } from '@/i18n/useT';
import { useAppStore, useZone } from '@/store/useAppStore';
import { radius, spacing, useTheme } from '@/theme';
import { distanceMeters, formatDistance, formatRadius } from '@/utils/geo';

import { ChecklistEditor } from './components/ChecklistEditor';
import { confirmDeleteZone, editZone } from './zoneActions';
import { toMapZone, walkMinutes } from './zoneVisuals';

export default function ZoneDetailScreen() {
  const t = useT();
  const { colors } = useTheme();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const zone = useZone(id);
  const position = usePosition();
  const setZoneActive = useAppStore((state) => state.setZoneActive);
  const updateChecklist = useAppStore((state) => state.updateChecklist);

  const edit = (
    <Pressable onPress={() => editZone(id)} hitSlop={10} accessibilityRole="button">
      <AppText variant="button" color="primary">
        {t.common.edit}
      </AppText>
    </Pressable>
  );

  if (!zone) {
    return (
      <SheetScreen backLabel={t.zoneDetail.title} headerRight={null}>
        <AppText color="textSecondary">{t.zoneDetail.missing}</AppText>
      </SheetScreen>
    );
  }

  const distance = position ? distanceMeters(position, zone) : null;
  const done = zone.checklist.filter((item) => item.done).length;
  const total = zone.checklist.length;
  const showList = zone.contentMode === 'list' && total > 0;
  const showNote = zone.note.trim().length > 0 && (zone.contentMode === 'note' || total === 0);

  /** After deleting: back to where the user came from (map or list). */
  function leaveAfterDelete() {
    if (from) router.navigate(from as Href);
    else if (router.canGoBack()) router.back();
    else router.replace('/zones');
  }

  function openDirections() {
    if (!zone) return;
    void Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${zone.latitude},${zone.longitude}&travelmode=walking`,
    );
  }

  return (
    <SheetScreen
      backLabel={t.zoneDetail.title}
      headerRight={edit}
      mapHeight={250}
      map={{
        zones: [toMapZone(zone, colors.primary)],
        user: position,
        view: { key: `zone-${zone.id}-${zone.radius}`, center: { lat: zone.latitude, lng: zone.longitude }, zoom: zone.radius > 400 ? 14 : 16 },
      }}
      mapOverlay={
        distance !== null ? (
          <View style={[styles.distanceChip, { backgroundColor: colors.surface }]}>
            <Icon name="footsteps-outline" size={14} color="primary" />
            <AppText variant="caption" style={{ fontWeight: '600' }}>
              {t.zoneDetail.fromYou(formatDistance(distance), walkMinutes(distance))}
            </AppText>
          </View>
        ) : undefined
      }>
      {/* Name, type, address */}
      <View style={{ gap: spacing.sm }}>
        <View style={styles.titleRow}>
          <AppText variant="display" style={{ flex: 1 }}>
            {zone.name}
          </AppText>
          <Pill label={t.kinds[zone.kind]} tone="primary" />
        </View>
        {zone.address ? (
          <AppText variant="body" color="textSecondary">
            {zone.address}
          </AppText>
        ) : null}
        <View style={styles.facts}>
          <View style={styles.fact}>
            <Icon name="scan-outline" size={16} color="textSecondary" />
            <AppText variant="caption" color="textSecondary">
              {t.zoneDetail.radius(formatRadius(zone.radius))}
            </AppText>
          </View>
          <View style={styles.fact}>
            <Icon name={TRIGGER_ICONS[zone.trigger]} size={16} color="textSecondary" />
            <AppText variant="caption" color="textSecondary">
              {zone.trigger === 'enter' ? t.zoneDetail.onEnter : zone.trigger === 'exit' ? t.zoneDetail.onExit : t.zoneDetail.onBoth}
            </AppText>
          </View>
          <View style={styles.fact}>
            <Icon name={zone.alertStyle === 'alarm' ? 'alarm-outline' : 'notifications-outline'} size={16} color="textSecondary" />
            <AppText variant="caption" color="textSecondary">
              {zone.alertStyle === 'alarm' ? t.zoneEditor.alarm : t.zoneEditor.notification}
            </AppText>
          </View>
        </View>
      </View>

      {/* Checklist or note */}
      {showList ? (
        <View style={{ gap: spacing.sm }}>
          <View style={styles.titleRow}>
            <AppText variant="headline" style={{ flex: 1 }}>
              {t.zoneDetail.alongTheWay}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {t.zoneDetail.progress(done, total)}
            </AppText>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
            <View style={[styles.fill, { backgroundColor: colors.primary, width: `${Math.round((done / total) * 100)}%` }]} />
          </View>
          <ChecklistEditor items={zone.checklist} onChange={(items) => void updateChecklist(zone.id, items)} look="plain" readOnlyItems />
        </View>
      ) : null}
      {showNote ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="headline">{t.zoneDetail.note}</AppText>
          <AppText variant="body">{zone.note}</AppText>
        </View>
      ) : null}
      {!showList && !showNote ? (
        <AppText variant="body" color="textSecondary">
          {t.zoneDetail.emptyContent}
        </AppText>
      ) : null}

      {/* On / off */}
      <View style={[styles.statusCard, { backgroundColor: zone.active ? colors.successSoft : colors.surfaceMuted }]}>
        <Icon name={zone.alertStyle === 'alarm' ? 'alarm-outline' : 'notifications-outline'} size={22} color={zone.active ? 'success' : 'textSecondary'} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="headline" color={zone.active ? 'success' : 'text'}>
            {zone.active ? t.zoneDetail.activeTitle : t.zoneDetail.pausedTitle}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {zone.active ? t.zoneDetail.activeText(zone.trigger, zone.repeat, zone.alertStyle === 'alarm') : t.zoneDetail.pausedText}
          </AppText>
        </View>
        <Switch
          value={zone.active}
          onValueChange={(active) => void setZoneActive(zone.id, active)}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#FFFFFF"
          accessibilityLabel={zone.active ? t.zoneDetail.activeTitle : t.zoneDetail.pausedTitle}
        />
      </View>

      <Button title={t.zoneDetail.directions} icon="navigate-outline" variant="soft" onPress={openDirections} />

      {/* Edit / delete */}
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button title={t.zoneDetail.editZone} icon="create-outline" variant="secondary" onPress={() => editZone(zone.id)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title={t.zoneDetail.deleteZone}
            icon="trash-outline"
            variant="danger"
            onPress={() => confirmDeleteZone(zone, t, leaveAfterDelete)}
          />
        </View>
      </View>
    </SheetScreen>
  );
}

/** Icon for each trigger. */
const TRIGGER_ICONS = { enter: 'enter-outline', exit: 'exit-outline', both: 'swap-horizontal-outline' } as const;

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  fact: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  distanceChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
});
