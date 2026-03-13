import { Cycle } from './cycle.interface';

export interface CycleAssignment {
  id: number;
  cycle: Cycle;
  startDateLocal: string;
  endDateLocal: string;
}

export interface CreateCycleAssignmentDto {
  cycleId: number;
  startDateLocal: string;
  endDateLocal?: string;
}

export type UpdateCycleAssignmentDto = Partial<CreateCycleAssignmentDto>;
