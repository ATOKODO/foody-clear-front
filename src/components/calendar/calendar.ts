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
  CalendarInsertedProduct,
  CalendarDaySlot,
} from '../../interfaces/calendar.interface';
import { CycleAssignment } from '../../interfaces/cycle-assignment.interface';
import {
  InputDayDaySetSlotSummary,
  InputDayItemSummary,
  InputDayItemsBySlotEntry,
  InputDayResponse,
  InputDaySlotSummary,
} from '../../interfaces/input-day.interface';
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
  dateLocal: string;
  hour: HourSlot;
  sourceAssignment: CycleAssignment | null;
}

export interface CalendarMonthClickEvent {
  view: CalendarView;
  currentDateIso: string;
  month: MonthSummary;
  sourceAssignments: CycleAssignment[];
}

export interface CalendarViewChangeEvent {
  view: CalendarView;
  anchorDateLocal: string;
  fromDateLocal: string;
  toDateLocal: string;
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule],
  templateUrl: './calendar.html',
})
export class Calendar implements OnInit, OnChanges {
  @Input() cycleAssignments: CycleAssignment[] = [];
  @Input() inputDayResponse: InputDayResponse | null = null;
  @Input() inputDayItemsBySlot: InputDayItemsBySlotEntry[] = [];
  @Input() loadingDayItems = false;
  @Input() dayItemsError: unknown = null;
  @Input() inputDayTimezone = DateTime.local().zoneName || 'UTC';

  @Output() readonly dayClick = new EventEmitter<CalendarDayClickEvent>();
  @Output() readonly hourClick = new EventEmitter<CalendarHourClickEvent>();
  @Output() readonly monthClick = new EventEmitter<CalendarMonthClickEvent>();
  @Output() readonly viewChanged = new EventEmitter<CalendarViewChangeEvent>();

  readonly VIEWS: CalendarView[] = ['year', 'month', 'week', 'day'];
  readonly WEEKDAY_NAMES = WEEKDAY_NAMES;

  currentView: CalendarView = 'month';
  currentDate = DateTime.now();
  loading = false;

  monthDays: CalendarDay[] = [];
  weekDays: CalendarDay[] = [];
  yearMonths: MonthSummary[] = [];
  dayHours: HourSlot[] = [];
  daySlots: CalendarDaySlot[] = [];

  private assignmentById = new Map<string, CycleAssignment>();

  ngOnInit(): void {
    this.refreshView();
    this.viewChanged.emit(this.buildViewChangeEvent());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cycleAssignments']) {
      this.applyAssignments();
    }

    if (
      changes['inputDayResponse'] ||
      changes['inputDayItemsBySlot'] ||
      changes['inputDayTimezone']
    ) {
      this.applyInputDayData();
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
    this.viewChanged.emit(this.buildViewChangeEvent());
  }

  switchView(view: CalendarView): void {
    if (view === this.currentView) {
      return;
    }

    this.currentView = view;
    this.refreshView();
    this.viewChanged.emit(this.buildViewChangeEvent());
  }

  goToToday(): void {
    this.currentDate = DateTime.now();
    this.refreshView();
    this.viewChanged.emit(this.buildViewChangeEvent());
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

  onHourClick(hour: HourSlot, dateLocal?: string): void {
    const resolvedDateLocal = dateLocal ?? this.currentDate.toISODate() ?? '';
    const assignmentFromDate =
      resolvedDateLocal === '' ? null : (this.findAssignmentForDate(resolvedDateLocal) ?? null);
    const assignmentFromHour =
      hour.assignment && hour.assignment.id
        ? (this.assignmentById.get(hour.assignment.id) ?? null)
        : null;
    const sourceAssignment = assignmentFromDate ?? assignmentFromHour;

    this.hourClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal: resolvedDateLocal,
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
    this.applyInputDayData();
  }

  formatInsertedAt(insertedAt: string): string {
    const parsed = DateTime.fromISO(insertedAt, { setZone: true });
    if (!parsed.isValid) {
      return insertedAt;
    }

    return parsed.setZone(this.normalizeTimezone()).toFormat('HH:mm');
  }

  formatSlotRange(slot: CalendarDaySlot): string {
    const start = this.formatClock(slot.startTime);
    const end = this.formatClock(slot.endTime);

    if (start && end) {
      return `${start}-${end}`;
    }

    return start ?? end ?? 'horaire libre';
  }

  private buildViewChangeEvent(): CalendarViewChangeEvent {
    let from = this.currentDate.startOf('day');
    let to = this.currentDate.endOf('day');

    if (this.currentView === 'year') {
      from = this.currentDate.startOf('year');
      to = this.currentDate.endOf('year');
    } else if (this.currentView === 'month') {
      from = this.currentDate.startOf('month');
      to = this.currentDate.endOf('month');
    } else if (this.currentView === 'week') {
      from = this.currentDate.startOf('week');
      to = this.currentDate.endOf('week');
    }

    return {
      view: this.currentView,
      anchorDateLocal: this.currentDate.toISODate() ?? '',
      fromDateLocal: from.toISODate() ?? '',
      toDateLocal: to.toISODate() ?? '',
    };
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

  private applyInputDayData(): void {
    const entries = this.resolveItemsBySlotEntries();
    const slots = this.resolveDaySlots();
    this.applyDaySlots(slots);
    this.applyDayInsertedProducts(entries, this.inputDayResponse?.items ?? []);
  }

  private resolveItemsBySlotEntries(): InputDayItemsBySlotEntry[] {
    if (this.inputDayResponse?.itemsBySlot && this.inputDayResponse.itemsBySlot.length > 0) {
      return this.inputDayResponse.itemsBySlot;
    }

    if (this.inputDayItemsBySlot && this.inputDayItemsBySlot.length > 0) {
      return this.inputDayItemsBySlot;
    }

    return this.buildItemsBySlotEntriesFromResponse();
  }

  private resolveDaySlots(): CalendarDaySlot[] {
    const daySetSlots = this.inputDayResponse?.daySet?.slots ?? [];
    const totalsSlots = this.inputDayResponse?.totalsMacros?.bySlot.map((entry) => entry.slot) ?? [];
    const legacySlots = this.inputDayResponse?.slots ?? [];

    const ordered = this.mergeSlots(daySetSlots, totalsSlots, legacySlots);
    return ordered.map((slot) => ({
      slotId: slot.slotId,
      slotKey: slot.slotKey,
      title: slot.title,
      sortOrder: slot.sortOrder,
      startTime: slot.startTime ?? null,
      endTime: slot.endTime ?? null,
    }));
  }

  private mergeSlots(
    ...sources: Array<InputDayDaySetSlotSummary[]>
  ): InputDayDaySetSlotSummary[] {
    const unique = new Map<string, InputDayDaySetSlotSummary>();

    sources.forEach((slots) => {
      slots.forEach((slot) => {
        const key = slot.slotId !== null ? `id:${slot.slotId}` : `key:${slot.slotKey}`;
        if (!unique.has(key)) {
          unique.set(key, slot);
        }
      });
    });

    return Array.from(unique.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private buildItemsBySlotEntriesFromResponse(): InputDayItemsBySlotEntry[] {
    const response = this.inputDayResponse;
    if (!response || response.items.length === 0) {
      return [];
    }

    const slots = this.resolveDaySlots();
    if (slots.length === 0) {
      return [];
    }

    const entries: InputDayItemsBySlotEntry[] = slots.map((slot) => ({
      slot: this.toSlotSummary(slot),
      items: [],
    }));
    const entryByKey = new Map(entries.map((entry) => [entry.slot.slotKey, entry]));

    response.items.forEach((item) => {
      const matchedSlot = this.resolveSlotForInsertedAt(item.insertedAt, slots);
      if (!matchedSlot) {
        return;
      }

      entryByKey.get(matchedSlot.slotKey)?.items.push(item);
    });

    return entries;
  }

  private toSlotSummary(slot: CalendarDaySlot): InputDaySlotSummary {
    return {
      slotId: slot.slotId,
      slotKey: slot.slotKey,
      title: slot.title,
      sortOrder: slot.sortOrder,
      startTime: slot.startTime ?? null,
      endTime: slot.endTime ?? null,
    };
  }

  private resolveSlotForInsertedAt(
    insertedAt: string,
    slots: CalendarDaySlot[],
  ): CalendarDaySlot | null {
    const parsed = DateTime.fromISO(insertedAt, { setZone: true });
    if (!parsed.isValid) {
      return null;
    }

    const localized = parsed.setZone(this.normalizeTimezone());
    const secondsFromMidnight =
      localized.hour * 3600 + localized.minute * 60 + localized.second;

    return (
      slots.find((slot) =>
        this.isInSlotWindow(
          secondsFromMidnight,
          slot.startTime ?? null,
          slot.endTime ?? null,
        ),
      ) ?? null
    );
  }

  private isInSlotWindow(
    secondsFromMidnight: number,
    startTime: string | null,
    endTime: string | null,
  ): boolean {
    if (!startTime || !endTime) {
      return false;
    }

    const startSeconds = this.parseTimeToSeconds(startTime);
    const endSeconds = this.parseTimeToSeconds(endTime);
    if (startSeconds === null || endSeconds === null) {
      return false;
    }

    if (startSeconds === endSeconds) {
      return true;
    }

    if (startSeconds < endSeconds) {
      return secondsFromMidnight >= startSeconds && secondsFromMidnight < endSeconds;
    }

    return secondsFromMidnight >= startSeconds || secondsFromMidnight < endSeconds;
  }

  private parseTimeToSeconds(value: string): number | null {
    const parts = value.split(':');
    if (parts.length < 2) {
      return null;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = Number((parts[2] ?? '0').split('.')[0]);
    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes) ||
      !Number.isFinite(seconds) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59 ||
      seconds < 0 ||
      seconds > 59
    ) {
      return null;
    }

    return hours * 3600 + minutes * 60 + seconds;
  }

  private applyDaySlots(slots: CalendarDaySlot[]): void {
    this.daySlots = slots;
    this.dayHours.forEach((hour) => {
      hour.activeSlots = [];
    });

    if (this.currentView !== 'day' || slots.length === 0) {
      return;
    }

    this.dayHours.forEach((hour) => {
      const hourStart = hour.hour * 60;
      const hourEnd = hourStart + 60;
      hour.activeSlots = slots.filter((slot) =>
        this.isSlotOverlappingHour(slot, hourStart, hourEnd),
      );
    });
  }

  private isSlotOverlappingHour(
    slot: CalendarDaySlot,
    hourStart: number,
    hourEnd: number,
  ): boolean {
    const start = this.toMinutes(slot.startTime);
    const end = this.toMinutes(slot.endTime);

    if (start === null && end === null) {
      return false;
    }

    const startMinutes = start ?? 0;
    const endMinutes = end ?? 24 * 60;
    if (endMinutes <= startMinutes) {
      return false;
    }

    return startMinutes < hourEnd && endMinutes > hourStart;
  }

  private toMinutes(time: string | null | undefined): number | null {
    if (!time) {
      return null;
    }

    const parts = time.split(':');
    if (parts.length < 2) {
      return null;
    }

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
      return null;
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return hour * 60 + minute;
  }

  private formatClock(time: string | null | undefined): string | null {
    if (!time) {
      return null;
    }

    return time.length >= 5 ? time.slice(0, 5) : time;
  }

  private applyDayInsertedProducts(
    entries: InputDayItemsBySlotEntry[],
    responseItems: InputDayItemSummary[],
  ): void {
    this.clearDayInsertedProducts();
    if (this.currentView !== 'day') {
      return;
    }

    const items = responseItems.length > 0
      ? responseItems
      : entries.flatMap((entry) => entry.items);

    const slotByItemId = new Map<number, { slotTitle: string; slotKey: string }>();
    entries.forEach((entry) => {
      entry.items.forEach((item) => {
        slotByItemId.set(item.id, {
          slotTitle: entry.slot.title,
          slotKey: entry.slot.slotKey,
        });
      });
    });

    items.forEach((item) => {
      const parsed = DateTime.fromISO(item.insertedAt, { setZone: true });
      if (!parsed.isValid) {
        return;
      }

      const localized = parsed.setZone(this.normalizeTimezone());
      const targetHour = this.dayHours.find((hour) => hour.hour === localized.hour);
      if (!targetHour) {
        return;
      }

      if (!targetHour.insertedProducts) {
        targetHour.insertedProducts = [];
      }

      const slot = slotByItemId.get(item.id);
      const insertedProduct: CalendarInsertedProduct = {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        qty: item.qty,
        insertedAt: item.insertedAt,
        slotTitle: slot?.slotTitle ?? 'Sans slot',
        slotKey: slot?.slotKey ?? '-',
      };

      targetHour.insertedProducts.push(insertedProduct);
      targetHour.insertedProducts.sort(
        (a, b) => DateTime.fromISO(a.insertedAt).toMillis() - DateTime.fromISO(b.insertedAt).toMillis(),
      );
    });
  }

  private findAssignmentForDate(dateIso: string): CycleAssignment | undefined {
    return this.cycleAssignments.find((assignment) =>
      this.isDateInRange(dateIso, assignment.startDateLocal, assignment.endDateLocal),
    );
  }

  private clearDayInsertedProducts(): void {
    this.dayHours.forEach((hour) => {
      hour.insertedProducts = [];
    });
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

  private normalizeTimezone(): string {
    const candidate = this.inputDayTimezone.trim() || 'UTC';
    return DateTime.now().setZone(candidate).isValid ? candidate : 'UTC';
  }
}
