// calendar-container.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
  InputDayMacroValue,
  InputDayDaySetSlotSummary,
  InputDayItemSummary,
  InputDayItemsBySlotEntry,
  InputDayResponse,
  InputDaySlotSummary,
  InputDayTargetSource,
  InputWeekResponse,
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
  occurredAt: string | null;
  hour: HourSlot;
  sourceAssignment: CycleAssignment | null;
}

export interface CalendarMonthClickEvent {
  view: CalendarView;
  currentDateIso: string;
  dateLocal: string;
  month: MonthSummary;
  sourceAssignments: CycleAssignment[];
}

export interface CalendarManageItemsEvent {
  view: CalendarView;
  currentDateIso: string;
  dateLocal: string;
  sourceAssignment: CycleAssignment | null;
}

export interface CalendarViewChangeEvent {
  view: CalendarView;
  anchorDateLocal: string;
  fromDateLocal: string;
  toDateLocal: string;
}

export interface CalendarItemClickEvent {
  view: CalendarView;
  currentDateIso: string;
  dateLocal: string;
  item: CalendarInsertedProduct;
}

interface CalendarWeekMacroHighlight {
  key: string;
  label: string;
  value: string;
  unit: string;
  tone: 'energy' | 'proteins' | 'carbs' | 'lipids';
}

interface CalendarDayAssignmentHighlight {
  title: string;
  progress: string | null;
  colorClass: string;
}

interface CalendarMacroMetricEntry {
  key: string;
  label: string;
  value: string;
  unit: string;
}

interface CalendarWeekTimelineBlock {
  id: string;
  kind: 'slot' | 'orphan';
  title: string;
  rangeLabel: string;
  startMinute: number;
  endMinute: number;
  items: CalendarInsertedProduct[];
  tone: number;
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule, MatButtonModule, MatButtonToggleModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar implements OnInit, OnChanges {
  @Input() cycleAssignments: CycleAssignment[] = [];
  @Input() inputDayResponse: InputDayResponse | null = null;
  @Input() inputWeekResponse: InputWeekResponse | null = null;
  @Input() inputDayItemsBySlot: InputDayItemsBySlotEntry[] = [];
  @Input() loadingDayItems = false;
  @Input() dayItemsError: unknown = null;
  @Input() inputDayTimezone = DateTime.local().zoneName || 'UTC';

  @Output() readonly dayClick = new EventEmitter<CalendarDayClickEvent>();
  @Output() readonly hourClick = new EventEmitter<CalendarHourClickEvent>();
  @Output() readonly monthClick = new EventEmitter<CalendarMonthClickEvent>();
  @Output() readonly manageItems = new EventEmitter<CalendarManageItemsEvent>();
  @Output() readonly itemClick = new EventEmitter<CalendarItemClickEvent>();
  @Output() readonly viewChanged = new EventEmitter<CalendarViewChangeEvent>();

  readonly VIEWS: CalendarView[] = ['year', 'month', 'week', 'day'];
  readonly WEEKDAY_NAMES = WEEKDAY_NAMES;
  readonly HOURS = Array.from({ length: 24 }, (_, hour) => hour);

  currentView: CalendarView = 'month';
  currentDate = DateTime.now();
  loading = false;

  monthDays: CalendarDay[] = [];
  weekDays: CalendarDay[] = [];
  yearMonths: MonthSummary[] = [];
  dayHours: HourSlot[] = [];
  daySlots: CalendarDaySlot[] = [];

  private assignmentById = new Map<string, CycleAssignment>();
  private weekDayResponseByDate = new Map<string, InputDayResponse>();
  private weekDaySlotsByDate = new Map<string, CalendarDaySlot[]>();
  private weekTimelineBlocksByDate = new Map<string, CalendarWeekTimelineBlock[]>();
  private readonly emptySlots: CalendarDaySlot[] = [];
  private readonly emptyWeekTimelineBlocks: CalendarWeekTimelineBlock[] = [];
  private readonly weekMacroOrder = ['energyKcal', 'proteins', 'carbs', 'lipids'];
  private readonly weekMacroDefinitions: Record<
    string,
    { label: string; unit: string; tone: CalendarWeekMacroHighlight['tone'] }
  > = {
    energyKcal: { label: 'Energie', unit: 'kcal', tone: 'energy' },
    proteins: { label: 'Proteines', unit: 'g', tone: 'proteins' },
    carbs: { label: 'Glucides', unit: 'g', tone: 'carbs' },
    lipids: { label: 'Lipides', unit: 'g', tone: 'lipids' },
  };

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
      changes['inputWeekResponse'] ||
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
      occurredAt: this.buildOccurredAtForHour(resolvedDateLocal, hour.hour),
      hour,
      sourceAssignment,
    });
  }

  onMonthClick(month: MonthSummary): void {
    const sourceAssignments = this.cycleAssignments.filter((assignment) =>
      this.isDateRangeOverlappingMonth(assignment, month),
    );
    const dateLocal = DateTime.local(month.year, month.month, 1).toISODate() ?? '';

    this.monthClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal,
      month,
      sourceAssignments,
    });
  }

  onManageItems(dateLocal: string): void {
    const sourceAssignment =
      dateLocal.trim() === '' ? null : (this.findAssignmentForDate(dateLocal) ?? null);

    this.manageItems.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal,
      sourceAssignment,
    });
  }

  onCurrentDayClick(): void {
    const currentDateIso = this.currentDate.toISODate();
    if (!currentDateIso) {
      return;
    }

    this.dayClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      day: {
        date: currentDateIso,
        dateObj: this.currentDate,
        dayNumber: this.currentDate.day,
        isToday: this.currentDate.hasSame(DateTime.now(), 'day'),
        isCurrentMonth: true,
        isWeekend: this.currentDate.weekday >= 6,
        assignment: this.buildCalendarAssignmentForDate(currentDateIso),
      },
      sourceAssignment: this.findAssignmentForDate(currentDateIso) ?? null,
    });
  }

  onItemClick(item: CalendarInsertedProduct, dateLocal: string, event: Event): void {
    event.stopPropagation();

    this.itemClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal,
      item,
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

  getViewLabel(view: CalendarView): string {
    if (view === 'year') {
      return 'Annee';
    }

    if (view === 'month') {
      return 'Mois';
    }

    if (view === 'week') {
      return 'Semaine';
    }

    return 'Jour';
  }

  private refreshView(): void {
    this.loadView();
    this.applyAssignments();
    this.applyInputDayData();
  }

  formatItemTime(occurredAt: string | null, insertedAt: string): string {
    const parsed = DateTime.fromISO(occurredAt?.trim() || insertedAt, { setZone: true });
    if (!parsed.isValid) {
      return occurredAt?.trim() || insertedAt;
    }

    return parsed.setZone(this.normalizeTimezone()).toFormat('HH:mm');
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

  getTargetSourceText(targetSource: InputDayTargetSource): string {
    if (targetSource === 'cycle') {
      return 'Cible du cycle';
    }

    if (targetSource === 'daySet') {
      return 'Cible du day set';
    }

    return 'Aucune cible';
  }

  getTargetSourceBadgeText(targetSource: InputDayTargetSource): string {
    if (targetSource === 'cycle') {
      return 'Cibles cycle';
    }

    if (targetSource === 'daySet') {
      return 'Cibles day set';
    }

    return 'Sans cible';
  }

  hasWeekDaySummaryData(day: CalendarDay): boolean {
    const response = this.getWeekDayResponse(day.date);

    return Boolean(day.assignment || response?.assignment || this.hasWeekDayInsights(day.date));
  }

  hasWeekDayInsights(dateLocal: string): boolean {
    const response = this.getWeekDayResponse(dateLocal);

    return Boolean(
      response?.daySet ||
      response?.totalsMacros ||
      this.getWeekDaySlotCount(dateLocal) > 0 ||
      this.getWeekDayProductCount(dateLocal) > 0,
    );
  }

  getWeekSummaryDayCount(): number {
    return this.weekDays.filter((day) => this.hasWeekDaySummaryData(day)).length;
  }

  getWeekSummaryItemCount(): number {
    return Array.from(this.weekDayResponseByDate.values()).reduce(
      (total, response) => total + response.items.length,
      0,
    );
  }

  getWeekSummaryEnergyTotal(): string {
    const total = Array.from(this.weekDayResponseByDate.values()).reduce((sum, response) => {
      const energy = response.totalsMacros?.dayTotal['energyKcal'];
      return typeof energy === 'number' ? sum + energy : sum;
    }, 0);

    return this.formatCompactNumber(total, 0);
  }

  getWeekDayCycleTitle(day: CalendarDay): string | null {
    return (
      day.assignment?.cycleName ??
      day.assignment?.label ??
      this.getWeekDayResponse(day.date)?.assignment?.cycleTitle ??
      null
    );
  }

  getWeekDayCycleProgress(day: CalendarDay): string | null {
    if (day.assignment?.dayNumber) {
      return day.assignment.totalDays
        ? `J${day.assignment.dayNumber}/${day.assignment.totalDays}`
        : `J${day.assignment.dayNumber}`;
    }

    const dayIndex = this.getWeekDayResponse(day.date)?.assignment?.dayIndex;
    return typeof dayIndex === 'number' ? `J${dayIndex}` : null;
  }

  getWeekDayProductCount(dateLocal: string): number {
    return this.weekDayResponseByDate.get(dateLocal)?.items.length ?? 0;
  }

  getWeekDaySlotCount(dateLocal: string): number {
    return this.getWeekDaySlots(dateLocal).length;
  }

  getWeekDayMacroHighlights(dateLocal: string): CalendarWeekMacroHighlight[] {
    return this.buildMacroHighlights(
      this.weekDayResponseByDate.get(dateLocal)?.totalsMacros?.dayTotal ?? null,
    );
  }

  getDayMacroHighlights(): CalendarWeekMacroHighlight[] {
    return this.buildMacroHighlights(this.inputDayResponse?.totalsMacros?.dayTotal ?? null);
  }

  getDayAssignmentHighlight(): CalendarDayAssignmentHighlight | null {
    const currentDateLocal = this.currentDate.toISODate();
    if (currentDateLocal) {
      const assignment = this.buildCalendarAssignmentForDate(currentDateLocal);
      if (assignment) {
        return {
          title: assignment.cycleName ?? assignment.label ?? 'Cycle actif',
          progress: assignment.dayNumber
            ? assignment.totalDays
              ? `Jour ${assignment.dayNumber}/${assignment.totalDays}`
              : `Jour ${assignment.dayNumber}`
            : null,
          colorClass: assignment.color ?? 'bg-slate-700',
        };
      }
    }

    const assignment = this.inputDayResponse?.assignment;
    if (!assignment) {
      return null;
    }

    return {
      title: assignment.cycleTitle,
      progress: `Jour ${assignment.dayIndex}`,
      colorClass: 'bg-slate-700',
    };
  }

  getDayItemCount(): number {
    return this.inputDayResponse?.items.length ?? 0;
  }

  getDaySlotCount(): number {
    return this.daySlots.length;
  }

  getDayEnergyTotal(): string {
    const energy = this.inputDayResponse?.totalsMacros?.dayTotal['energyKcal'];
    return typeof energy === 'number' ? this.formatCompactNumber(energy, 0) : '0';
  }

  getYearMonthCount(): number {
    return this.yearMonths.length;
  }

  getYearAssignedDayCount(): number {
    return this.yearMonths.reduce(
      (total, month) => total + this.getYearMonthAssignedDayCount(month),
      0,
    );
  }

  getYearActiveMonthCount(): number {
    return this.yearMonths.filter((month) => month.hasAssignments).length;
  }

  getYearMonthAssignedDayCount(month: MonthSummary): number {
    return month.days.filter((day) => day.isCurrentMonth && day.assignment).length;
  }

  getYearMonthCycleCount(month: MonthSummary): number {
    return new Set(
      month.days
        .filter((day) => day.isCurrentMonth && day.assignment)
        .map((day) => day.assignment?.cycleName ?? day.assignment?.label ?? '')
        .filter((label) => label.trim() !== ''),
    ).size;
  }

  getMonthDayCount(): number {
    return this.monthDays.filter((day) => day.isCurrentMonth).length;
  }

  getMonthAssignedDayCount(): number {
    return this.monthDays.filter((day) => day.isCurrentMonth && day.assignment).length;
  }

  getMonthCycleCount(): number {
    return new Set(
      this.monthDays
        .filter((day) => day.isCurrentMonth && day.assignment)
        .map((day) => day.assignment?.cycleName ?? day.assignment?.label ?? '')
        .filter((label) => label.trim() !== ''),
    ).size;
  }

  getDayMetricEntries(
    metrics: Record<string, number | InputDayMacroValue> | null | undefined,
  ): CalendarMacroMetricEntry[] {
    if (!metrics) {
      return [];
    }

    const entries = Object.entries(metrics).sort(([leftKey], [rightKey]) => {
      const leftIndex = this.weekMacroOrder.indexOf(leftKey);
      const rightIndex = this.weekMacroOrder.indexOf(rightKey);

      if (leftIndex === -1 && rightIndex === -1) {
        return leftKey.localeCompare(rightKey, 'fr');
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    });

    return entries.map(([key, value]) => {
      const definition = this.weekMacroDefinitions[key];

      return {
        key,
        label: definition?.label ?? key,
        value: this.formatMetricValue(value),
        unit: definition?.unit ?? '',
      };
    });
  }

  getDayTimelineBlocks(): CalendarWeekTimelineBlock[] {
    const dateLocal = this.inputDayResponse?.dateLocal ?? this.currentDate.toISODate() ?? '';
    if (dateLocal.trim() === '') {
      return this.emptyWeekTimelineBlocks;
    }

    const slots = this.resolveDaySlots();
    const insertedProducts = this.buildCalendarInsertedProducts(
      this.resolveItemsBySlotEntries(),
      this.inputDayResponse?.items ?? [],
      dateLocal,
      slots,
    );

    return this.buildWeekTimelineBlocks(dateLocal, slots, insertedProducts);
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
    this.applyWeekInputDayData();

    if (this.currentView !== 'day') {
      this.daySlots = [];
      this.clearDayInsertedProducts();
      return;
    }

    const entries = this.resolveItemsBySlotEntries();
    const slots = this.resolveDaySlots();
    this.applyDaySlots(slots);
    this.applyDayInsertedProducts(entries, this.inputDayResponse?.items ?? []);
  }

  getWeekDayResponse(dateLocal: string): InputDayResponse | null {
    return this.weekDayResponseByDate.get(dateLocal) ?? null;
  }

  getWeekDaySlots(dateLocal: string): CalendarDaySlot[] {
    return this.weekDaySlotsByDate.get(dateLocal) ?? this.emptySlots;
  }

  getWeekTimelineBlocks(dateLocal: string): CalendarWeekTimelineBlock[] {
    return this.weekTimelineBlocksByDate.get(dateLocal) ?? this.emptyWeekTimelineBlocks;
  }

  getWeekHourGridRowStart(hour: number): number {
    return 2 + hour * 2;
  }

  getWeekHourGridRowEnd(hour: number): number {
    return this.getWeekHourGridRowStart(hour) + 2;
  }

  getWeekTimelineBlockGridRowStart(block: CalendarWeekTimelineBlock): number {
    return 2 + Math.floor(block.startMinute / 30);
  }

  getWeekTimelineBlockGridRowEnd(block: CalendarWeekTimelineBlock): number {
    const start = this.getWeekTimelineBlockGridRowStart(block);
    const end = 2 + Math.ceil(block.endMinute / 30);
    return Math.max(start + 1, end);
  }

  trackByDate(_: number, day: CalendarDay): string {
    return day.date;
  }

  trackByHour(_: number, hour: number | HourSlot): number {
    return typeof hour === 'number' ? hour : hour.hour;
  }

  trackBySlot(_: number, slot: CalendarDaySlot): string {
    return `${slot.slotId ?? slot.slotKey ?? slot.title}-${slot.startTime ?? ''}-${slot.endTime ?? ''}`;
  }

  trackByInsertedProduct(_: number, product: CalendarInsertedProduct): number {
    return product.id;
  }

  trackByWeekMacro(_: number, macro: CalendarWeekMacroHighlight): string {
    return macro.key;
  }

  trackByMacroMetricEntry(_: number, entry: CalendarMacroMetricEntry): string {
    return entry.key;
  }

  trackByWeekTimelineBlock(_: number, block: CalendarWeekTimelineBlock): string {
    return block.id;
  }

  trackByMonth(_: number, month: MonthSummary): string {
    return `${month.year}-${month.month}`;
  }

  onWeekTimelineBlockClick(
    day: CalendarDay,
    block: CalendarWeekTimelineBlock,
    event: Event,
  ): void {
    event.stopPropagation();

    const hour = Math.max(0, Math.min(23, Math.floor(block.startMinute / 60)));
    this.onHourClick(
      {
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        assignment: day.assignment,
      },
      day.date,
    );
  }

  onDayTimelineBlockClick(block: CalendarWeekTimelineBlock, event: Event): void {
    event.stopPropagation();

    const dateLocal = this.inputDayResponse?.dateLocal ?? this.currentDate.toISODate() ?? '';
    if (dateLocal.trim() === '') {
      return;
    }

    const hour = Math.max(0, Math.min(23, Math.floor(block.startMinute / 60)));
    this.onHourClick(
      {
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
      },
      dateLocal,
    );
  }

  private applyWeekInputDayData(): void {
    this.weekDayResponseByDate.clear();
    this.weekDaySlotsByDate.clear();
    this.weekTimelineBlocksByDate.clear();

    this.resolveWeekDayResponses().forEach((response) => {
      if (!response.dateLocal || response.dateLocal.trim() === '') {
        return;
      }

      this.weekDayResponseByDate.set(response.dateLocal, response);

      const slots = this.resolveDaySlotsForResponse(response);
      this.weekDaySlotsByDate.set(response.dateLocal, slots);

      const entries = this.resolveItemsBySlotEntriesForResponse(response);
      const insertedProducts = this.buildCalendarInsertedProducts(
        entries,
        response.items ?? [],
        response.dateLocal,
        slots,
      );

      this.weekTimelineBlocksByDate.set(
        response.dateLocal,
        this.buildWeekTimelineBlocks(response.dateLocal, slots, insertedProducts),
      );
    });
  }

  private resolveWeekDayResponses(): InputDayResponse[] {
    if (this.inputWeekResponse?.days && this.inputWeekResponse.days.length > 0) {
      return this.inputWeekResponse.days;
    }

    if (this.currentView === 'week' && this.inputDayResponse) {
      return [this.inputDayResponse];
    }

    return [];
  }

  private resolveItemsBySlotEntries(): InputDayItemsBySlotEntry[] {
    return this.resolveItemsBySlotEntriesForResponse(
      this.inputDayResponse,
      this.inputDayItemsBySlot,
    );
  }

  private resolveItemsBySlotEntriesForResponse(
    response: InputDayResponse | null,
    fallbackEntries: InputDayItemsBySlotEntry[] = [],
  ): InputDayItemsBySlotEntry[] {
    if (response?.itemsBySlot && response.itemsBySlot.length > 0) {
      return response.itemsBySlot;
    }

    if (fallbackEntries.length > 0) {
      return fallbackEntries;
    }

    return this.buildItemsBySlotEntriesFromResponse(response);
  }

  private resolveDaySlots(): CalendarDaySlot[] {
    return this.resolveDaySlotsForResponse(this.inputDayResponse);
  }

  private resolveDaySlotsForResponse(response: InputDayResponse | null): CalendarDaySlot[] {
    const daySetSlots = response?.daySet?.slots ?? [];
    const totalsSlots = response?.totalsMacros?.bySlot.map((entry) => entry.slot) ?? [];
    const legacySlots = response?.slots ?? [];

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

  private buildItemsBySlotEntriesFromResponse(
    response: InputDayResponse | null,
  ): InputDayItemsBySlotEntry[] {
    if (!response || response.items.length === 0) {
      return [];
    }

    const slots = this.resolveDaySlotsForResponse(response);
    if (slots.length === 0) {
      return [];
    }

    const entries: InputDayItemsBySlotEntry[] = slots.map((slot) => ({
      slot: this.toSlotSummary(slot),
      items: [],
    }));
    const entryByKey = new Map(entries.map((entry) => [entry.slot.slotKey, entry]));

    response.items.forEach((item) => {
      const matchedSlot = this.resolveSlotForItem(item, slots);
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

  private resolveSlotForItem(
    item: InputDayItemSummary,
    slots: CalendarDaySlot[],
  ): CalendarDaySlot | null {
    if (item.slotId !== null) {
      const matchedById = slots.find((slot) => slot.slotId === item.slotId);
      if (matchedById) {
        return matchedById;
      }
    }

    const trimmedSlotKey = item.slotKey?.trim() ?? '';
    if (trimmedSlotKey !== '') {
      const matchedByKey = slots.find((slot) => slot.slotKey === trimmedSlotKey);
      if (matchedByKey) {
        return matchedByKey;
      }
    }

    return this.resolveSlotForTimestamp(this.resolveItemTimestamp(item), slots);
  }

  private resolveSlotForTimestamp(
    timestamp: string | null,
    slots: CalendarDaySlot[],
  ): CalendarDaySlot | null {
    if (!timestamp) {
      return null;
    }

    const parsed = DateTime.fromISO(timestamp, { setZone: true });
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

  private formatWeekMacroValue(value: InputDayMacroValue): string {
    if (typeof value !== 'number') {
      return '...';
    }

    return this.formatCompactNumber(value, Math.abs(value) >= 100 ? 0 : 1);
  }

  private buildMacroHighlights(
    dayTotal: Record<string, InputDayMacroValue> | null,
  ): CalendarWeekMacroHighlight[] {
    if (!dayTotal) {
      return [];
    }

    return this.weekMacroOrder.flatMap((key) => {
      const definition = this.weekMacroDefinitions[key];
      const value = dayTotal[key];
      if (!definition || value === null || value === undefined) {
        return [];
      }

      return [
        {
          key,
          label: definition.label,
          value: this.formatWeekMacroValue(value),
          unit: definition.unit,
          tone: definition.tone,
        },
      ];
    });
  }

  private formatMetricValue(value: number | InputDayMacroValue): string {
    if (typeof value === 'number') {
      return this.formatCompactNumber(value, Math.abs(value) >= 100 ? 0 : 1);
    }

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }

    return '--';
  }

  private formatCompactNumber(value: number, maximumFractionDigits: number): string {
    const hasFraction = Math.abs(value % 1) > Number.EPSILON;

    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: hasFraction ? Math.min(1, maximumFractionDigits) : 0,
      maximumFractionDigits,
    }).format(value);
  }

  private applyDayInsertedProducts(
    entries: InputDayItemsBySlotEntry[],
    responseItems: InputDayItemSummary[],
  ): void {
    this.clearDayInsertedProducts();
    if (this.currentView !== 'day') {
      return;
    }

    const byHour = this.buildInsertedProductsByHour(
      entries,
      responseItems,
      this.inputDayResponse?.dateLocal ?? this.currentDate.toISODate() ?? '',
      this.daySlots,
    );
    this.dayHours.forEach((hour) => {
      hour.insertedProducts = byHour.get(hour.hour) ?? [];
    });
  }

  private buildInsertedProductsByHour(
    entries: InputDayItemsBySlotEntry[],
    responseItems: InputDayItemSummary[],
    dateLocal: string,
    slots: CalendarDaySlot[],
  ): Map<number, CalendarInsertedProduct[]> {
    const items = this.buildCalendarInsertedProducts(entries, responseItems, dateLocal, slots);
    const byHour = new Map<number, CalendarInsertedProduct[]>();

    items.forEach((item) => {
      const minute = this.resolveCalendarInsertedProductMinute(item);
      if (minute === null) {
        return;
      }

      const hour = Math.floor(minute / 60);
      const products = byHour.get(hour) ?? [];
      products.push(item);
      byHour.set(hour, products);
    });

    return byHour;
  }

  private buildCalendarInsertedProducts(
    entries: InputDayItemsBySlotEntry[],
    responseItems: InputDayItemSummary[],
    dateLocal: string,
    slots: CalendarDaySlot[],
  ): CalendarInsertedProduct[] {
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

    const insertedProducts = items.flatMap((item) => {
      const timestamp = this.resolveItemTimestamp(item);
      if (!timestamp) {
        return [];
      }

      const parsed = DateTime.fromISO(timestamp, { setZone: true });
      if (!parsed.isValid) {
        return [];
      }

      const slot =
        slotByItemId.get(item.id) ??
        this.resolveCalendarSlotInfo(this.resolveSlotForItem(item, slots), item);

      return [
        {
          id: item.id,
          dateLocal,
          productId: item.productId,
          productName: item.productName,
          qty: item.qty,
          occurredAt: item.occurredAt,
          insertedAt: item.insertedAt,
          slotId: item.slotId,
          slotTitle: slot?.slotTitle ?? 'Sans slot',
          slotKey: slot?.slotKey ?? item.slotKey?.trim() ?? '-',
        },
      ];
    });

    insertedProducts.sort((left, right) => {
      const leftMinute = this.resolveCalendarInsertedProductMinute(left);
      const rightMinute = this.resolveCalendarInsertedProductMinute(right);
      if (leftMinute !== null && rightMinute !== null && leftMinute !== rightMinute) {
        return leftMinute - rightMinute;
      }

      return left.id - right.id;
    });

    return insertedProducts;
  }

  private buildWeekTimelineBlocks(
    dateLocal: string,
    slots: CalendarDaySlot[],
    insertedProducts: CalendarInsertedProduct[],
  ): CalendarWeekTimelineBlock[] {
    const blocks: CalendarWeekTimelineBlock[] = [];
    const slotKeys = new Set(slots.map((slot) => slot.slotKey));
    const productsBySlotKey = new Map<string, CalendarInsertedProduct[]>();

    insertedProducts.forEach((product) => {
      if (!slotKeys.has(product.slotKey)) {
        return;
      }

      const products = productsBySlotKey.get(product.slotKey) ?? [];
      products.push(product);
      productsBySlotKey.set(product.slotKey, products);
    });

    slots.forEach((slot, index) => {
      const block = this.buildWeekTimelineSlotBlock(
        dateLocal,
        slot,
        productsBySlotKey.get(slot.slotKey) ?? [],
        index,
      );

      if (block) {
        blocks.push(block);
      }
    });

    const orphanProducts = insertedProducts.filter((product) => !slotKeys.has(product.slotKey));
    const orphanProductsByHour = new Map<number, CalendarInsertedProduct[]>();
    orphanProducts.forEach((product) => {
      const minute = this.resolveCalendarInsertedProductMinute(product);
      const startMinute = minute === null ? 0 : Math.floor(minute / 60) * 60;
      const products = orphanProductsByHour.get(startMinute) ?? [];
      products.push(product);
      orphanProductsByHour.set(startMinute, products);
    });

    orphanProductsByHour.forEach((products, startMinute) => {
      const endMinute = this.normalizeTimelineEndMinute(
        startMinute,
        Math.max(
          startMinute + 60,
          ...products.map((product) => (this.resolveCalendarInsertedProductMinute(product) ?? startMinute) + 30),
        ),
      );

      blocks.push({
        id: `orphan:${dateLocal}:${startMinute}`,
        kind: 'orphan',
        title: 'Sans slot',
        rangeLabel: `${this.formatMinutesClock(startMinute)}-${this.formatMinutesClock(endMinute)}`,
        startMinute,
        endMinute,
        items: products,
        tone: 4,
      });
    });

    return blocks.sort(
      (left, right) =>
        left.startMinute - right.startMinute ||
        left.endMinute - right.endMinute ||
        left.title.localeCompare(right.title, 'fr'),
    );
  }

  private buildWeekTimelineSlotBlock(
    dateLocal: string,
    slot: CalendarDaySlot,
    items: CalendarInsertedProduct[],
    index: number,
  ): CalendarWeekTimelineBlock | null {
    const slotStart = this.toMinutes(slot.startTime);
    const slotEnd = this.toMinutes(slot.endTime);
    const firstItemMinute = items.length > 0 ? this.resolveCalendarInsertedProductMinute(items[0]) : null;
    const lastItemMinute =
      items.length > 0 ? this.resolveCalendarInsertedProductMinute(items[items.length - 1]) : null;

    const startMinute = slotStart ?? firstItemMinute;
    if (startMinute === null) {
      return null;
    }

    const endMinute = this.normalizeTimelineEndMinute(
      startMinute,
      slotEnd ?? (lastItemMinute !== null ? lastItemMinute + 30 : startMinute + 60),
    );

    return {
      id: `slot:${dateLocal}:${slot.slotId ?? slot.slotKey}`,
      kind: 'slot',
      title: slot.title,
      rangeLabel: this.formatSlotRange(slot),
      startMinute,
      endMinute,
      items,
      tone: index % 4,
    };
  }

  private normalizeTimelineEndMinute(startMinute: number, endMinute: number): number {
    return Math.max(startMinute + 30, Math.min(24 * 60, endMinute));
  }

  private formatMinutesClock(totalMinutes: number): string {
    const clamped = Math.max(0, Math.min(24 * 60, totalMinutes));
    const hours = Math.floor(clamped / 60);
    const minutes = clamped % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private resolveCalendarInsertedProductMinute(product: CalendarInsertedProduct): number | null {
    const parsed = DateTime.fromISO(product.occurredAt?.trim() || product.insertedAt, { setZone: true });
    if (!parsed.isValid) {
      return null;
    }

    const localized = parsed.setZone(this.normalizeTimezone());
    return localized.hour * 60 + localized.minute;
  }

  private resolveItemTimestamp(item: InputDayItemSummary): string | null {
    const occurredAt = item.occurredAt?.trim();
    if (occurredAt) {
      return occurredAt;
    }

    return item.insertedAt?.trim() || null;
  }

  private resolveCalendarSlotInfo(
    slot: CalendarDaySlot | null,
    item: InputDayItemSummary,
  ): { slotTitle: string; slotKey: string } | null {
    if (slot) {
      return {
        slotTitle: slot.title,
        slotKey: slot.slotKey,
      };
    }

    const slotKey = item.slotKey?.trim();
    if (!slotKey) {
      return null;
    }

    return {
      slotTitle: slotKey,
      slotKey,
    };
  }

  private buildOccurredAtForHour(dateLocal: string, hour: number): string | null {
    if (!dateLocal || !Number.isInteger(hour) || hour < 0 || hour > 23) {
      return null;
    }

    const parsed = DateTime.fromISO(dateLocal, { zone: this.normalizeTimezone() }).set({
      hour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    if (!parsed.isValid) {
      return null;
    }

    return parsed.toISO({ suppressMilliseconds: true });
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
