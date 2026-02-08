export type CycleDurationType = 'jour' | 'semaine' | 'mois';

export interface Cycle {
  id: number;
  title: string;
  color: string;
  proteins: number;
  carbs: number;
  lipids: number;
  durationCount: number;
  durationType: CycleDurationType;
  daySetOrder?: number[];
  daySets?: unknown[];
}

export interface CreateCycleDto {
  title: string;
  color: string;
  proteins: number;
  carbs: number;
  lipids: number;
  durationCount: number;
  durationType: CycleDurationType;
  daySetIds?: number[];
}

export type UpdateCycleDto = Partial<CreateCycleDto>;
