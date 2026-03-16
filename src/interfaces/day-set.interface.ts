import { CycleNutritionValue } from './cycle.interface';
import { TemplateSummary } from './template.interface';

export interface DaySet {
  id: number;
  title: string;
  nutritionValues?: CycleNutritionValue[];
  slotIds?: number[];
  slots?: unknown[];
  templateId?: number | null;
  template?: TemplateSummary | null;
}

export interface CreateDaySetDto {
  title: string;
  nutritionValues?: CycleNutritionValue[];
  slotIds?: number[];
  templateId?: number | null;
}

export type UpdateDaySetDto = Partial<CreateDaySetDto>;
