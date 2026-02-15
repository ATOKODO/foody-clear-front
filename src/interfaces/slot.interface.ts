import { CycleNutritionValue } from './cycle.interface';

export interface Slot {
  id: number;
  key: string;
  title: string;
  sortOrder: number;
  startTime?: string | null;
  endTime?: string | null;
  nutritionValues?: CycleNutritionValue[];
  daySets?: unknown[];
}

export interface CreateSlotDto {
  key: string;
  title: string;
  sortOrder: number;
  startTime?: string | null;
  endTime?: string | null;
  nutritionValues?: CycleNutritionValue[];
}

export type UpdateSlotDto = Partial<CreateSlotDto>;
