// types/calendar.types.ts
import { DateTime } from 'luxon';

export type CalendarView = 'year' | 'month' | 'week' | 'day';

export interface CalendarDay {
  date: string;
  dateObj: DateTime;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  assignment?: CalendarAssignment;
}

export interface CalendarAssignment {
  id: string;
  type: 'cycle' | 'cheat_day' | 'workout' | 'meal';
  cycleName?: string;
  dayNumber?: number;
  totalDays?: number;
  calorieTarget?: number;
  actualCalories?: number;
  label?: string;
  color?: string;
}

export interface MonthSummary {
  month: number;
  year: number;
  name: string;
  days: CalendarDay[];
  hasAssignments: boolean;
}

export interface HourSlot {
  hour: number;
  label: string;
  assignment?: CalendarAssignment;
}