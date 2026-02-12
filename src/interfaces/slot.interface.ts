import { CycleNutritionValue } from './cycle.interface';

export interface Slot {
  id: number;
  key: string;
  title: string;
  sortOrder: number;
  nutritionValues?: CycleNutritionValue[];
  daySets?: unknown[];
}

export interface CreateSlotDto {
  key: string;
  title: string;
  sortOrder: number;
  nutritionValues?: CycleNutritionValue[];
}

export type UpdateSlotDto = Partial<CreateSlotDto>;
