import type {
  InputDayItemSummary,
  InputDayTemplateItemSummary,
} from '../../interfaces/input-day.interface';

export type HomeMacroKey = 'energyKcal' | 'proteins' | 'carbs' | 'lipids';
export type HomeMacroStatus = 'neutral' | 'under' | 'exact' | 'over';

export interface HomeMacroDefinition {
  key: HomeMacroKey;
  label: string;
  unit: string;
}

export interface HomeMacroCard extends HomeMacroDefinition {
  actual: string;
  target: string;
  delta: string;
  progress: number;
  status: HomeMacroStatus;
}

export interface HomeScheduleRow {
  key: string;
  title: string;
  rangeLabel: string;
  items: InputDayItemSummary[];
  plannedItems: InputDayTemplateItemSummary[];
}

export interface HomeDayEntryRow {
  key: string;
  id: number;
  timeLabel: string;
  productName: string;
  slotLabel: string;
  qtyLabel: string;
  isExternal: boolean;
  paymentLabel: string | null;
}

export const HOME_MACRO_DEFINITIONS: readonly HomeMacroDefinition[] = [
  { key: 'energyKcal', label: 'Energie', unit: 'kcal' },
  { key: 'proteins', label: 'Proteines', unit: 'g' },
  { key: 'carbs', label: 'Glucides', unit: 'g' },
  { key: 'lipids', label: 'Lipides', unit: 'g' },
];
