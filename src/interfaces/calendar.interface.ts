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

export interface CalendarInsertedProduct {
  id: number;
  dateLocal: string;
  productId: number;
  productName: string;
  qty: number;
  occurredAt: string | null;
  insertedAt: string;
  slotId: number | null;
  slotTitle: string;
  slotKey: string;
  templateItemId: number | null;
}

export interface CalendarDaySlot {
  slotId: number | null;
  slotKey: string;
  title: string;
  sortOrder: number;
  startTime?: string | null;
  endTime?: string | null;
}

export interface HourSlot {
  hour: number;
  label: string;
  assignment?: CalendarAssignment;
  insertedProducts?: CalendarInsertedProduct[];
  activeSlots?: CalendarDaySlot[];
}
