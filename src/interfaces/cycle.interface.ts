export type CycleDurationType = 'jour' | 'semaine' | 'mois';
export type CycleAssignmentRescheduleScope = 'future' | 'all';
export type CycleAssignmentGapMode = 'preserve' | 'compact';

export type NutritionReference = 'PER_100G' | 'PER_100ML';

export interface CycleNutritionValue {
  nutritionKey: string;
  amount: number;
  unit: string;
  reference: NutritionReference;
}

export interface Cycle {
  id: number;
  title: string;
  color: string;
  proteins?: number;
  carbs?: number;
  lipids?: number;
  energyKcal?: number;
  nutritionValues?: CycleNutritionValue[];
  durationDays: number;
  durationCount: number;
  durationType: CycleDurationType;
  slotIds?: number[];
  defaultTemplateId?: number | null;
  slots?: {
    id: number;
    key: string;
    title: string;
    sortOrder: number;
    startTime?: string | null;
    endTime?: string | null;
  }[];
  daySetOrder?: number[];
  daySets?: unknown[];
}

export interface CreateCycleDto {
  title: string;
  color: string;
  nutritionValues?: CycleNutritionValue[];
  durationDays: number;
  durationCount: number;
  durationType: CycleDurationType;
  slotIds?: number[];
  defaultTemplateId?: number | null;
  daySetIds?: number[];
  daySetOrder?: number[];
}

export type UpdateCycleDto = Partial<CreateCycleDto> & {
  assignmentRescheduleScope?: CycleAssignmentRescheduleScope;
  assignmentGapMode?: CycleAssignmentGapMode;
  assignmentEffectiveDateLocal?: string;
};
