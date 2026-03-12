import { CycleNutritionValue } from './cycle.interface';

export interface DaySet {
  id: number;
  title: string;
  nutritionValues?: CycleNutritionValue[];
  slotIds?: number[];
  slots?: unknown[];
}

export interface CreateDaySetDto {
  title: string;
  nutritionValues?: CycleNutritionValue[];
  slotIds?: number[];
}

export type UpdateDaySetDto = Partial<CreateDaySetDto>;
