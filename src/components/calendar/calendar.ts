// calendar-container.component.ts
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateTime } from 'luxon';
import {
  CalendarView,
  CalendarDay,
  MonthSummary,
  HourSlot,
  CalendarAssignment,
} from '../../interfaces/calendar.interface';
import { CycleAssignment } from '../../interfaces/cycle-assignment.interface';
import {
  generateMonthDays,
  generateWeekDays,
  generateYearMonths,
  generateDayHours,
  WEEKDAY_NAMES,
} from '../../utils/calendar.utils';

export interface CalendarDayClickEvent {
  view: CalendarView;
  currentDateIso: string;
  day: CalendarDay;
  sourceAssignment: CycleAssignment | null;
}

export interface CalendarHourClickEvent {
  view: CalendarView;
  currentDateIso: string;
  hour: HourSlot;
  sourceAssignment: CycleAssignment | null;
}

export interface CalendarMonthClickEvent {
  view: CalendarView;
  currentDateIso: string;
  month: MonthSummary;
  sourceAssignments: CycleAssignment[];
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule],
  templateUrl: './calendar.html',
})
export class Calendar implements OnInit, OnChanges {
  @Input() cycleAssignments: CycleAssignment[] = [];

  @Output() readonly dayClick = new EventEmitter<CalendarDayClickEvent>();
  @Output() readonly hourClick = new EventEmitter<CalendarHourClickEvent>();
  @Output() readonly monthClick = new EventEmitter<CalendarMonthClickEvent>();

  readonly VIEWS: CalendarView[] = ['year', 'month', 'week', 'day'];
  readonly WEEKDAY_NAMES = WEEKDAY_NAMES;

  currentView: CalendarView = 'month';
  currentDate = DateTime.now();
  loading = false;

  monthDays: CalendarDay[] = [];
  weekDays: CalendarDay[] = [];
  yearMonths: MonthSummary[] = [];
  dayHours: HourSlot[] = [];

  private assignmentById = new Map<string, CycleAssignment>();

  ngOnInit(): void {
    this.refreshView();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cycleAssignments']) {
      this.applyAssignments();
    }
  }

  loadView(): void {
    this.loading = true;

    switch (this.currentView) {
      case 'month':
        this.monthDays = generateMonthDays(this.currentDate.month, this.currentDate.year);
        break;
      case 'week':
        this.weekDays = generateWeekDays(this.currentDate);
        break;
      case 'year':
        this.yearMonths = generateYearMonths(this.currentDate.year);
        break;
      case 'day':
        this.dayHours = generateDayHours();
        break;
    }

    this.loading = false;
  }

  applyAssignments(): void {
    this.assignmentById.clear();
    this.cycleAssignments.forEach((assignment) => {
      this.assignmentById.set(String(assignment.id), assignment);
    });

    if (this.currentView === 'month') {
      this.monthDays.forEach((day) => {
        day.assignment = this.buildCalendarAssignmentForDate(day.date);
      });
      return;
    }

    if (this.currentView === 'week') {
      this.weekDays.forEach((day) => {
        day.assignment = this.buildCalendarAssignmentForDate(day.date);
      });
      return;
    }

    if (this.currentView === 'day') {
      this.dayHours.forEach((hour) => {
        hour.assignment = undefined;
      });

      const currentDateIso = this.currentDate.toISODate();
      if (!currentDateIso) {
        return;
      }

      const assignment = this.buildCalendarAssignmentForDate(currentDateIso);
      if (!assignment) {
        return;
      }

      const targetHour = this.dayHours.find((hour) => hour.hour === 12);
      if (targetHour) {
        targetHour.assignment = assignment;
      }
      return;
    }

    if (this.currentView === 'year') {
      this.yearMonths.forEach((month) => {
        month.days.forEach((day) => {
          day.assignment = this.buildCalendarAssignmentForDate(day.date);
        });
        month.hasAssignments = month.days.some((day) => day.assignment !== undefined);
      });
    }
  }

  navigate(direction: 'prev' | 'next'): void {
    switch (this.currentView) {
      case 'month':
        this.currentDate =
          direction === 'next'
            ? this.currentDate.plus({ months: 1 })
            : this.currentDate.minus({ months: 1 });
        break;
      case 'week':
        this.currentDate =
          direction === 'next'
            ? this.currentDate.plus({ weeks: 1 })
            : this.currentDate.minus({ weeks: 1 });
        break;
      case 'year':
        this.currentDate =
          direction === 'next'
            ? this.currentDate.plus({ years: 1 })
            : this.currentDate.minus({ years: 1 });
        break;
      case 'day':
        this.currentDate =
          direction === 'next'
            ? this.currentDate.plus({ days: 1 })
            : this.currentDate.minus({ days: 1 });
        break;
    }

    this.refreshView();
  }

  switchView(view: CalendarView): void {
    this.currentView = view;
    this.refreshView();
  }

  goToToday(): void {
    this.currentDate = DateTime.now();
    this.refreshView();
  }

  onDayClick(day: CalendarDay): void {
    const sourceAssignment =
      day.assignment && day.assignment.id
        ? (this.assignmentById.get(day.assignment.id) ?? null)
        : null;

    this.dayClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      day,
      sourceAssignment,
    });
  }

  onHourClick(hour: HourSlot): void {
    const sourceAssignment =
      hour.assignment && hour.assignment.id
        ? (this.assignmentById.get(hour.assignment.id) ?? null)
        : null;

    this.hourClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      hour,
      sourceAssignment,
    });
  }

  onMonthClick(month: MonthSummary): void {
    const sourceAssignments = this.cycleAssignments.filter((assignment) =>
      this.isDateRangeOverlappingMonth(assignment, month),
    );

    this.monthClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      month,
      sourceAssignments,
    });
  }

  get currentViewLabel(): string {
    switch (this.currentView) {
      case 'year':
        return this.currentDate.toFormat('yyyy');
      case 'month':
        return this.currentDate.toFormat('LLLL yyyy', { locale: 'fr' });
      case 'week': {
        const start = this.currentDate.startOf('week');
        const end = this.currentDate.endOf('week');
        return `${start.toFormat('d MMM', { locale: 'fr' })} - ${end.toFormat('d MMM yyyy', { locale: 'fr' })}`;
      }
      case 'day':
        return this.currentDate.toFormat('EEEE d LLLL yyyy', { locale: 'fr' });
      default:
        return '';
    }
  }

  private refreshView(): void {
    this.loadView();
    this.applyAssignments();
  }

  private buildCalendarAssignmentForDate(dateIso: string): CalendarAssignment | undefined {
    const assignment = this.findAssignmentForDate(dateIso);
    if (!assignment) {
      return undefined;
    }

    const startDate = DateTime.fromISO(assignment.startDateLocal).startOf('day');
    const endDate = DateTime.fromISO(assignment.endDateLocal).startOf('day');
    const currentDate = DateTime.fromISO(dateIso).startOf('day');

    const totalDays = Math.floor(endDate.diff(startDate, 'days').days) + 1;
    const dayNumber = Math.floor(currentDate.diff(startDate, 'days').days) + 1;

    return {
      id: String(assignment.id),
      type: 'cycle',
      cycleName: assignment.cycle.title,
      dayNumber,
      totalDays,
      label: assignment.cycle.title,
      color: this.resolveCycleColorClass(assignment.cycle.color),
    };
  }

  private findAssignmentForDate(dateIso: string): CycleAssignment | undefined {
    return this.cycleAssignments.find((assignment) =>
      this.isDateInRange(dateIso, assignment.startDateLocal, assignment.endDateLocal),
    );
  }

  private isDateInRange(dateIso: string, startDateLocal: string, endDateLocal: string): boolean {
    const currentDate = DateTime.fromISO(dateIso).startOf('day');
    const startDate = DateTime.fromISO(startDateLocal).startOf('day');
    const endDate = DateTime.fromISO(endDateLocal).startOf('day');

    if (!currentDate.isValid || !startDate.isValid || !endDate.isValid) {
      return false;
    }

    return currentDate >= startDate && currentDate <= endDate;
  }

  private isDateRangeOverlappingMonth(
    assignment: CycleAssignment,
    month: MonthSummary,
  ): boolean {
    const monthStart = DateTime.local(month.year, month.month, 1).startOf('day');
    const monthEnd = monthStart.endOf('month').startOf('day');
    const startDate = DateTime.fromISO(assignment.startDateLocal).startOf('day');
    const endDate = DateTime.fromISO(assignment.endDateLocal).startOf('day');

    if (!startDate.isValid || !endDate.isValid) {
      return false;
    }

    return startDate <= monthEnd && endDate >= monthStart;
  }

  private resolveCycleColorClass(color: string): string {
    const normalized = color.trim().toLowerCase();
    const colorMap: Record<string, string> = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
    };

    return colorMap[normalized] ?? 'bg-slate-500';
  }
}
