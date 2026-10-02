import {
  CalendarDaySlot,
  CalendarInsertedProduct,
} from '../../interfaces/calendar.interface';
import { InputDayMacroValue } from '../../interfaces/input-day.interface';

export type CalendarMacroTone = 'energy' | 'proteins' | 'carbs' | 'lipids';

export interface CalendarWeekMacroHighlight {
  key: string;
  label: string;
  value: string;
  unit: string;
  tone: CalendarMacroTone;
}

export interface CalendarDayAssignmentHighlight {
  title: string;
  progress: string | null;
  colorClass: string;
}

export interface CalendarMacroMetricEntry {
  key: string;
  label: string;
  value: string;
  unit: string;
}

export interface CalendarDayMacroCard {
  key: string;
  label: string;
  consumed: string;
  target: string;
  delta: string;
  unit: string;
  tone: CalendarMacroTone;
  status: 'under' | 'exact' | 'over' | 'neutral';
}

export interface CalendarDaySlotMacroGroup {
  key: string;
  title: string;
  rangeLabel: string;
  cards: CalendarDayMacroCard[];
}

export interface CalendarDayEntryRow {
  id: number;
  dateLocal: string;
  timeLabel: string;
  productName: string;
  qtyLabel: string;
  slotLabel: string;
  item: CalendarInsertedProduct;
}

export interface CalendarMacroComparison {
  key: string;
  label: string;
  abbr: string;
  value: string;
  target: string;
  percentage: string;
  status: 'under' | 'exact' | 'over';
  unit: string;
  tone: CalendarMacroTone;
}

export interface CalendarWeekTimelineBlock {
  id: string;
  kind: 'slot' | 'orphan';
  title: string;
  slotKey: string | null;
  rangeLabel: string;
  startMinute: number;
  endMinute: number;
  items: CalendarInsertedProduct[];
  plannedItems: CalendarPlannedTemplateItem[];
  tone: number;
}

export interface CalendarPlannedTemplateItem {
  id: number;
  productName: string;
  qtyLabel: string;
  slotKey: string;
  preferredMinute: number;
  stockAvailable: boolean;
  stockLabel: string;
  inventoryId: number | null;
  inventoryIds?: number[];
}

export interface CalendarMonthAlertBadge {
  key: string;
  text: string;
  tone: 'over' | 'projected' | 'template';
}

export interface CalendarMacroDefinition {
  label: string;
  abbr: string;
  unit: string;
  tone: CalendarMacroTone;
}

export interface CalendarSlotWindow {
  startMinute: number;
  endMinute: number;
  estimated: boolean;
}

export interface CalendarSlotInfo {
  slotTitle: string;
  slotKey: string;
}

export type CalendarMacroValues = Record<string, InputDayMacroValue>;

export const CALENDAR_MACRO_ORDER = [
  'energyKcal',
  'proteins',
  'carbs',
  'lipids',
] as const;

export const CALENDAR_MONTH_MACRO_ALERT_LABELS: Record<string, string> = {
  energyKcal: 'Kcal',
  proteins: 'P',
  carbs: 'G',
  lipids: 'L',
};

export const CALENDAR_MACRO_DEFINITIONS: Record<
  string,
  CalendarMacroDefinition
> = {
  energyKcal: {
    label: 'Energie',
    abbr: 'kcal',
    unit: 'kcal',
    tone: 'energy',
  },
  proteins: { label: 'Proteines', abbr: 'P', unit: 'g', tone: 'proteins' },
  carbs: { label: 'Glucides', abbr: 'G', unit: 'g', tone: 'carbs' },
  lipids: { label: 'Lipides', abbr: 'L', unit: 'g', tone: 'lipids' },
};

export function buildCalendarSlotTrackKey(slot: CalendarDaySlot): string {
  return `${slot.slotId ?? slot.slotKey ?? slot.title}-${slot.startTime ?? ''}-${slot.endTime ?? ''}`;
}
