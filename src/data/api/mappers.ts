/**
 * Converting between the app format (camelCase) and the Django format (snake_case).
 *
 * The {@link ZoneDTO} type describes exactly what the Django REST Framework
 * serializer should return — use it as a checklist when writing the backend.
 *
 * @module data/api/mappers
 * @category Django API (later)
 */
import type { ChecklistItem, Zone, ZoneInput } from '../types';

/** A zone as Django returns it. */
export interface ZoneDTO {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius: number;
  kind: Zone['kind'];
  content_mode: Zone['contentMode'];
  note: string;
  checklist: ChecklistItem[];
  trigger: Zone['trigger'];
  repeat: Zone['repeat'];
  alert_style: Zone['alertStyle'];
  active: boolean;
  reset_checklist_on_trigger: boolean;
  last_triggered_at: string | null;
  last_trigger_event?: Zone['lastTriggerEvent'];
  created_at: string;
  updated_at: string;
}

/** Django zone → app zone. */
export function zoneFromDTO(dto: ZoneDTO): Zone {
  return {
    id: dto.id,
    name: dto.name,
    address: dto.address,
    latitude: Number(dto.latitude),
    longitude: Number(dto.longitude),
    radius: dto.radius,
    kind: dto.kind,
    contentMode: dto.content_mode,
    note: dto.note,
    checklist: dto.checklist,
    trigger: dto.trigger,
    repeat: dto.repeat,
    alertStyle: dto.alert_style,
    active: dto.active,
    resetChecklistOnTrigger: dto.reset_checklist_on_trigger,
    lastTriggeredAt: dto.last_triggered_at,
    lastTriggerEvent: dto.last_trigger_event ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

/** App zone fields → Django request body. */
export function zoneToDTO(zone: Partial<ZoneInput & Pick<Zone, 'lastTriggeredAt' | 'lastTriggerEvent'>>) {
  return {
    name: zone.name,
    address: zone.address,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radius: zone.radius,
    kind: zone.kind,
    content_mode: zone.contentMode,
    note: zone.note,
    checklist: zone.checklist,
    trigger: zone.trigger,
    repeat: zone.repeat,
    alert_style: zone.alertStyle,
    active: zone.active,
    reset_checklist_on_trigger: zone.resetChecklistOnTrigger,
    last_triggered_at: zone.lastTriggeredAt,
    last_trigger_event: zone.lastTriggerEvent,
  };
}
