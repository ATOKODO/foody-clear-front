import type { Calendar } from '../../components/calendar/calendar';
import type { CalendarView } from '../../interfaces/calendar.interface';
import type { SegmentedToggleOption } from '../../app/ui/segmented-toggle/segmented-toggle';

export type PlanningCalendarController = Pick<
  Calendar,
  | 'currentView'
  | 'currentViewLabel'
  | 'goToToday'
  | 'navigate'
  | 'switchView'
  | 'activateDayView'
  | 'currentDate'
  | 'getViewLabel'
>;

export type PlanningActiveModal = 'actions' | 'assignment' | 'items' | null;

export type PlanningInputDataKind = 'day' | 'week' | 'month';

export interface PlanningInputDataRequest {
  requestId: number;
  requestKey: string;
  timezone: string;
}

export const PLANNING_CALENDAR_VIEW_OPTIONS: readonly SegmentedToggleOption<CalendarView>[] =
  [
    { value: 'day', label: 'Day', testId: 'planning-view-day' },
    { value: 'week', label: 'Week', testId: 'planning-view-week' },
    { value: 'month', label: 'Month', testId: 'planning-view-month' },
    { value: 'year', label: 'Year', testId: 'planning-view-year' },
  ];

export const AUTO_REFRESH_THROTTLE_MS = 30_000;
export const PLANNING_DATA_CACHE_MS = 60_000;
