import { TranslatePipe } from '../../app/i18n/translate-pipe';
// calendar-container.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output,
  inject,
} from '@angular/core';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DateTime, Info } from 'luxon';
import { Language } from '../../app/i18n/language';
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
import { Slot } from '../../interfaces/slot.interface';
import { resolveCycleToneClass } from '../shared/cycle-tone';
import {
  InputDayMacroValue,
  InputDayItemSummary,
  InputDayItemsBySlotEntry,
  InputMonthResponse,
  InputDayResponse,
  InputDayTargetSource,
  InputDayTotalsMacrosSummary,
  InputWeekResponse,
} from '../../interfaces/input-day.interface';
import {
  generateMonthDays,
  generateWeekDays,
  generateYearMonths,
  generateDayHours,
} from '../../utils/calendar.utils';
import {
  buildCalendarInsertedProducts,
  buildCalendarInsertedProductsByHour,
  buildCalendarItemsBySlotEntriesFromResponse,
  buildCalendarWeekTimelineBlocks,
  isCalendarSlotOverlappingHour,
  resolveCalendarDaySetSlots,
  resolveCalendarDaySlots,
  resolveCalendarItemsBySlotEntries,
  resolveCalendarTemplateSlots,
  resolvePendingCalendarTemplateItems,
} from './calendar-data.helpers';
import {
  buildCalendarDayMacroCards,
  buildCalendarDaySlotMacroGroups,
  buildCalendarMacroComparisonsFromTotals,
  buildCalendarMacroHighlights,
  buildCalendarMonthAlertBadges,
  formatCalendarCompactNumber,
  formatCalendarInsertedAt,
  formatCalendarItemTime,
  formatCalendarQuantityLabel,
  formatCalendarSlotRange,
  getCalendarDayTargetSourcePillText,
  getCalendarMetricEntries,
  getCalendarTargetSourceBadgeText,
  getCalendarTargetSourceText,
  getCalendarTemplateSourceBadgeText,
  normalizeCalendarTimezone,
} from './calendar-format.helpers';
import {
  buildCalendarSlotTrackKey,
  CalendarDayAssignmentHighlight,
  CalendarDayEntryRow,
  CalendarDayMacroCard,
  CalendarDaySlotMacroGroup,
  CalendarMacroComparison,
  CalendarMacroMetricEntry,
  CalendarMonthAlertBadge,
  CalendarPlannedTemplateItem,
  CalendarWeekMacroHighlight,
  CalendarWeekTimelineBlock,
} from './calendar.models';

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

export interface CalendarManageAssignmentEvent {
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

export interface CalendarOpenDayViewEvent {
  dateLocal: string;
}

export interface CalendarConvertTemplateItemEvent {
  dateLocal: string;
  templateItemId: number;
  inventoryId: number;
  inventoryIds?: number[];
}

export interface CalendarRevertTemplateItemEvent {
  dateLocal: string;
  itemId: number;
}

function formatCalendarAssignmentProgress(assignment: CalendarAssignment): string | null {
  if (assignment.dayNumber === null || assignment.dayNumber === undefined) {
    return null;
  }

  return assignment.totalDays
    ? `Day ${assignment.dayNumber}/${assignment.totalDays}`
    : `Day ${assignment.dayNumber}`;
}

@Component({
  selector: 'app-calendar',
  imports: [TranslatePipe, MatButtonModule, MatButtonToggleModule, DecimalPipe, NgTemplateOutlet],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar implements OnInit, OnChanges {
  readonly cycleAssignments = input<CycleAssignment[]>([]);
  readonly inputDayResponse = input<InputDayResponse | null>(null);
  readonly inputWeekResponse = input<InputWeekResponse | null>(null);
  readonly inputMonthResponse = input<InputMonthResponse | null>(null);
  readonly inputDayItemsBySlot = input<InputDayItemsBySlotEntry[]>([]);
  readonly loadingDayItems = input(false);
  readonly dayItemsError = input<unknown>(null);
  readonly inputDayTimezone = input(DateTime.local().zoneName || 'UTC');
  readonly slotCatalog = input<Slot[]>([]);
  readonly showHeader = input(true);
  readonly initialView = input<CalendarView | null>(null);
  readonly initialDateLocal = input<string | null>(null);

  readonly dayClick = output<CalendarDayClickEvent>();
  readonly hourClick = output<CalendarHourClickEvent>();
  readonly monthClick = output<CalendarMonthClickEvent>();
  readonly manageItems = output<CalendarManageItemsEvent>();
  readonly manageAssignment = output<CalendarManageAssignmentEvent>();
  readonly itemClick = output<CalendarItemClickEvent>();
  readonly convertTemplateItem = output<CalendarConvertTemplateItemEvent>();
  readonly revertTemplateItem = output<CalendarRevertTemplateItemEvent>();
  readonly openDayView = output<CalendarOpenDayViewEvent>();
  readonly viewChanged = output<CalendarViewChangeEvent>();

  readonly VIEWS: CalendarView[] = ['year', 'month', 'week', 'day'];
  readonly language = inject(Language);
  get WEEKDAY_NAMES(): string[] {
    return Info.weekdays('short', { locale: this.language.locale() });
  }
  readonly HOURS = Array.from({ length: 24 }, (_, hour) => hour);

  currentView: CalendarView = 'month';
  currentDate = DateTime.now();
  loading = false;
  showDaySlotStats = false;

  monthDays: CalendarDay[] = [];
  weekDays: CalendarDay[] = [];
  yearMonths: MonthSummary[] = [];
  dayHours: HourSlot[] = [];
  daySlots: CalendarDaySlot[] = [];

  private readonly assignmentById = new Map<string, CycleAssignment>();
  private readonly visibleDayResponseByDate = new Map<string, InputDayResponse>();
  private readonly visibleDaySlotsByDate = new Map<string, CalendarDaySlot[]>();
  private readonly visibleTimelineBlocksByDate = new Map<
    string,
    CalendarWeekTimelineBlock[]
  >();
  private readonly emptySlots: CalendarDaySlot[] = [];
  private readonly emptyWeekTimelineBlocks: CalendarWeekTimelineBlock[] = [];
  ngOnInit(): void {
    this.applyInitialState();
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
      changes['inputMonthResponse'] ||
      changes['inputDayItemsBySlot'] ||
      changes['inputDayTimezone'] ||
      changes['slotCatalog']
    ) {
      this.applyInputDayData();
    }
  }

  loadView(): void {
    this.loading = true;

    switch (this.currentView) {
      case 'month':
        this.monthDays = generateMonthDays(
          this.currentDate.month,
          this.currentDate.year,
        );
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
    this.cycleAssignments().forEach((assignment) => {
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
        month.hasAssignments = month.days.some(
          (day) => day.assignment !== undefined,
        );
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

  activateDayView(dateLocal: string): void {
    const parsedDate = DateTime.fromISO(dateLocal).startOf('day');
    if (!parsedDate.isValid) {
      return;
    }

    this.currentDate = parsedDate;
    this.currentView = 'day';
    this.refreshView();
    this.viewChanged.emit(this.buildViewChangeEvent());
  }

  onDayClick(day: CalendarDay): void {
    const sourceAssignment = day.assignment?.id
      ? (this.assignmentById.get(day.assignment.id) ?? null)
      : null;

    this.dayClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      day,
      sourceAssignment,
    });
  }

  onHourClick(hour: HourSlot, dateLocal?: string, minute = 0): void {
    const resolvedDateLocal = dateLocal ?? this.currentDate.toISODate() ?? '';
    const assignmentFromDate =
      resolvedDateLocal === ''
        ? null
        : (this.findAssignmentForDate(resolvedDateLocal) ?? null);
    const assignmentFromHour = hour.assignment?.id
      ? (this.assignmentById.get(hour.assignment.id) ?? null)
      : null;
    const sourceAssignment = assignmentFromDate ?? assignmentFromHour;

    this.hourClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal: resolvedDateLocal,
      occurredAt: this.buildOccurredAtForTime(
        resolvedDateLocal,
        hour.hour,
        minute,
      ),
      hour,
      sourceAssignment,
    });
  }

  onMonthClick(month: MonthSummary): void {
    const sourceAssignments = this.cycleAssignments().filter((assignment) =>
      this.isDateRangeOverlappingMonth(assignment, month),
    );
    const dateLocal = this.resolveMonthStartDateTime(month).toISODate() ?? '';

    this.monthClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal,
      month,
      sourceAssignments,
    });
  }

  openMonthView(month: MonthSummary): void {
    this.currentDate = this.resolveMonthStartDateTime(month);
    this.currentView = 'month';
    this.refreshView();
    this.viewChanged.emit(this.buildViewChangeEvent());
  }

  onManageItems(dateLocal: string): void {
    const sourceAssignment =
      dateLocal.trim() === ''
        ? null
        : (this.findAssignmentForDate(dateLocal) ?? null);

    this.manageItems.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal,
      sourceAssignment,
    });
  }

  onManageAssignment(dateLocal: string): void {
    const sourceAssignment =
      dateLocal.trim() === ''
        ? null
        : (this.findAssignmentForDate(dateLocal) ?? null);

    this.manageAssignment.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal,
      sourceAssignment,
    });
  }

  onMonthDayClick(day: CalendarDay): void {
    if (!day.isCurrentMonth) {
      return;
    }

    this.requestOpenDayView(day.date);
  }

  requestOpenDayView(dateLocal: string): void {
    const parsedDate = DateTime.fromISO(dateLocal);
    if (!parsedDate.isValid) {
      return;
    }

    this.openDayView.emit({ dateLocal });
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

  onItemClick(
    item: CalendarInsertedProduct,
    dateLocal: string,
    event: Event,
  ): void {
    event.stopPropagation();

    this.itemClick.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal,
      item,
    });
  }

  onDayTemplateItemConvert(
    item: CalendarPlannedTemplateItem,
    event: Event,
  ): void {
    event.stopPropagation();
    if (item.inventoryId === null || !item.stockAvailable) {
      return;
    }

    const dateLocal =
      this.inputDayResponse()?.dateLocal ?? this.currentDate.toISODate() ?? '';
    if (dateLocal.trim() === '') {
      return;
    }

    this.convertTemplateItem.emit({
      dateLocal,
      templateItemId: item.id,
      inventoryId: item.inventoryId,
      inventoryIds: item.inventoryIds ?? [item.inventoryId],
    });
  }

  onDayTemplateItemRevert(item: CalendarInsertedProduct, event: Event): void {
    event.stopPropagation();
    if (item.templateItemId === null) {
      return;
    }

    this.revertTemplateItem.emit({
      dateLocal: item.dateLocal,
      itemId: item.id,
    });
  }

  get currentViewLabel(): string {
    switch (this.currentView) {
      case 'year':
        return this.currentDate.toFormat('yyyy');
      case 'month':
        return this.currentDate.setLocale(this.language.locale()).toFormat('LLLL yyyy');
      case 'week': {
        const start = this.currentDate.startOf('week');
        const end = this.currentDate.endOf('week');
        return `${start.setLocale(this.language.locale()).toFormat('d MMM')} - ${end.setLocale(this.language.locale()).toFormat('d MMM yyyy')}`;
      }
      case 'day':
        return this.currentDate.setLocale(this.language.locale()).toFormat('EEEE d LLLL yyyy');
      default:
        return '';
    }
  }

  getViewLabel(view: CalendarView): string {
    if (view === 'year') {
      return 'Year';
    }

    if (view === 'month') {
      return 'Month';
    }

    if (view === 'week') {
      return 'Week';
    }

    return 'Day';
  }

  formatMonthName(month: MonthSummary): string {
    return DateTime.local(month.year, month.month).setLocale(this.language.locale()).toFormat('LLLL');
  }

  private refreshView(): void {
    this.loadView();
    this.applyAssignments();
    this.applyInputDayData();
  }

  private applyInitialState(): void {
    const requestedView = this.initialView();
    if (requestedView && this.VIEWS.includes(requestedView)) {
      this.currentView = requestedView;
    }

    const requestedDateLocal = this.initialDateLocal()?.trim() ?? '';
    if (!requestedDateLocal) {
      return;
    }

    const parsedDate = DateTime.fromISO(requestedDateLocal).startOf('day');
    if (parsedDate.isValid) {
      this.currentDate = parsedDate;
    }
  }

  formatItemTime(occurredAt: string | null, insertedAt: string): string {
    return formatCalendarItemTime(
      occurredAt,
      insertedAt,
      this.normalizeTimezone(),
    );
  }

  formatInsertedAt(insertedAt: string): string {
    return formatCalendarInsertedAt(insertedAt, this.normalizeTimezone());
  }

  formatSlotRange(slot: CalendarDaySlot): string {
    return formatCalendarSlotRange(slot);
  }

  getTargetSourceText(targetSource: InputDayTargetSource): string {
    return getCalendarTargetSourceText(targetSource);
  }

  getTargetSourceBadgeText(targetSource: InputDayTargetSource): string {
    return getCalendarTargetSourceBadgeText(targetSource);
  }

  hasWeekDaySummaryData(day: CalendarDay): boolean {
    const response = this.getWeekDayResponse(day.date);

    return Boolean(
      day.assignment ||
      response?.assignment ||
      this.hasWeekDayInsights(day.date),
    );
  }

  hasWeekDayInsights(dateLocal: string): boolean {
    const response = this.getWeekDayResponse(dateLocal);

    return Boolean(
      response?.daySet ||
      response?.templateAssociation ||
      response?.projectedTotalsMacros ||
      (response?.templateItems?.length ?? 0) > 0 ||
      response?.totalsMacros ||
      this.getWeekDaySlotCount(dateLocal) > 0 ||
      this.getWeekDayProductCount(dateLocal) > 0,
    );
  }

  getWeekSummaryDayCount(): number {
    return this.weekDays.filter((day) => this.hasWeekDaySummaryData(day))
      .length;
  }

  getWeekSummaryItemCount(): number {
    return Array.from(this.visibleDayResponseByDate.values()).reduce(
      (total, response) => total + this.getResponseEntryCount(response),
      0,
    );
  }

  getWeekSummaryTemplateDayCount(): number {
    return Array.from(this.visibleDayResponseByDate.values()).filter(
      (response) => this.hasTemplateData(response),
    ).length;
  }

  getWeekSummaryEnergyTotal(): string {
    const total = Array.from(this.visibleDayResponseByDate.values()).reduce(
      (sum, response) => {
        const energy = response.totalsMacros?.dayTotal['energyKcal'];
        return typeof energy === 'number' ? sum + energy : sum;
      },
      0,
    );

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
    const prefix = this.language.current() === 'fr' ? 'J' : 'D';
    if (day.assignment?.dayNumber) {
      return day.assignment.totalDays
        ? `${prefix}${day.assignment.dayNumber}/${day.assignment.totalDays}`
        : `${prefix}${day.assignment.dayNumber}`;
    }

    const dayIndex = this.getWeekDayResponse(day.date)?.assignment?.dayIndex;
    return typeof dayIndex === 'number' ? `${prefix}${dayIndex}` : null;
  }

  getWeekDayProductCount(dateLocal: string): number {
    const response = this.visibleDayResponseByDate.get(dateLocal) ?? null;
    return response ? this.getResponseEntryCount(response) : 0;
  }

  getWeekDaySlotCount(dateLocal: string): number {
    return this.getWeekDaySlots(dateLocal).length;
  }

  getWeekDayMacroComparisons(dateLocal: string): CalendarMacroComparison[] {
    return this.buildMacroComparisons(
      this.visibleDayResponseByDate.get(dateLocal) ?? null,
    );
  }

  getWeekDayProjectedMacroComparisons(
    dateLocal: string,
  ): CalendarMacroComparison[] {
    return this.buildProjectedMacroComparisons(
      this.visibleDayResponseByDate.get(dateLocal) ?? null,
    );
  }

  getMonthDayMacroComparisons(dateLocal: string): CalendarMacroComparison[] {
    return this.getWeekDayMacroComparisons(dateLocal);
  }

  getMonthDayProjectedMacroComparisons(
    dateLocal: string,
  ): CalendarMacroComparison[] {
    return this.getWeekDayProjectedMacroComparisons(dateLocal);
  }

  getDayMacroHighlights(): CalendarWeekMacroHighlight[] {
    return this.buildMacroHighlights(
      this.inputDayResponse()?.totalsMacros?.dayTotal ?? null,
    );
  }

  getDayProjectedMacroHighlights(): CalendarWeekMacroHighlight[] {
    return this.buildMacroHighlights(
      this.inputDayResponse()?.projectedTotalsMacros?.dayTotal ?? null,
    );
  }

  getDayAssignmentHighlight(): CalendarDayAssignmentHighlight | null {
    const currentDateLocal = this.currentDate.toISODate();
    if (currentDateLocal) {
      const assignment = this.buildCalendarAssignmentForDate(currentDateLocal);
      if (assignment) {
        return {
          title: assignment.cycleName ?? assignment.label ?? 'Active cycle',
          progress: formatCalendarAssignmentProgress(assignment),
          colorClass: assignment.color ?? 'app-tone--neutral',
        };
      }
    }

    const assignment = this.inputDayResponse()?.assignment;
    if (!assignment) {
      return null;
    }

    return {
      title: assignment.cycleTitle,
      progress: `Day ${assignment.dayIndex}`,
      colorClass: 'app-tone--neutral',
    };
  }

  getDayItemCount(): number {
    const response = this.inputDayResponse();
    return response ? this.getResponseEntryCount(response) : 0;
  }

  getDaySlotCount(): number {
    return this.daySlots.length;
  }

  getDayEnergyTotal(): string {
    const energy =
      this.inputDayResponse()?.totalsMacros?.dayTotal['energyKcal'];
    return typeof energy === 'number'
      ? this.formatCompactNumber(energy, 0)
      : '0';
  }

  getDayTargetHeadline(): string {
    const targetSource =
      this.inputDayResponse()?.totalsMacros?.targetSource ?? 'none';

    if (targetSource === 'cycle') {
      return 'Daily target inherited from the assigned cycle';
    }

    if (targetSource === 'daySet') {
      return 'Daily target inherited from the day set';
    }

    return 'No daily target resolved';
  }

  getDayTargetSupportingText(): string {
    const targetSource =
      this.inputDayResponse()?.totalsMacros?.targetSource ?? 'none';
    const assignmentTitle =
      this.getDayAssignmentHighlight()?.title ??
      this.inputDayResponse()?.assignment?.cycleTitle ??
      null;
    const daySetTitle = this.inputDayResponse()?.daySet?.title?.trim() ?? null;

    if (targetSource === 'cycle') {
      return assignmentTitle
        ? `Logged entries are compared with the ${assignmentTitle} cycle target.`
        : 'Logged entries are compared with the assigned cycle target.';
    }

    if (targetSource === 'daySet') {
      return daySetTitle
        ? `Logged entries are compared with the ${daySetTitle} day set target.`
        : 'Logged entries are compared with the day set nutrition target.';
    }

    return 'The daily dashboard only reflects entries that were actually logged.';
  }

  getDayTargetSourcePillText(targetSource: InputDayTargetSource): string {
    return getCalendarDayTargetSourcePillText(targetSource);
  }

  getDayMacroCards(): CalendarDayMacroCard[] {
    const totals = this.inputDayResponse()?.totalsMacros ?? null;
    return totals
      ? this.buildDayMacroCards(
          totals.dayTotal,
          totals.targets,
          totals.deltaToTargets,
        )
      : [];
  }

  getDaySlotMacroGroups(): CalendarDaySlotMacroGroup[] {
    return buildCalendarDaySlotMacroGroups(
      this.inputDayResponse()?.totalsMacros?.bySlot ?? [],
      undefined,
      this.language.locale(),
    );
  }

  toggleDaySlotStats(): void {
    this.showDaySlotStats = !this.showDaySlotStats;
  }

  getDayEntryRows(): CalendarDayEntryRow[] {
    const dateLocal =
      this.inputDayResponse()?.dateLocal ?? this.currentDate.toISODate() ?? '';
    if (dateLocal.trim() === '') {
      return [];
    }

    const insertedProducts = this.resolveCurrentDayInsertedProducts(
      dateLocal,
      this.resolveDaySlots(),
    );

    return insertedProducts.map((item) => ({
      id: item.id,
      dateLocal: item.dateLocal,
      timeLabel: this.formatItemTime(item.occurredAt, item.insertedAt),
      productName: item.productName,
      qtyLabel: this.formatQuantityLabel(item.qty),
      slotLabel: item.slotTitle || item.slotKey || 'Unassigned to a slot',
      item,
    }));
  }

  getProjectedDayEnergyTotal(): string {
    const energy =
      this.inputDayResponse()?.projectedTotalsMacros?.dayTotal['energyKcal'];
    return typeof energy === 'number'
      ? this.formatCompactNumber(energy, 0)
      : '0';
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
    return month.days.filter((day) => day.isCurrentMonth && day.assignment)
      .length;
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
    return this.monthDays.filter((day) => day.isCurrentMonth && day.assignment)
      .length;
  }

  getMonthCycleCount(): number {
    return new Set(
      this.monthDays
        .filter((day) => day.isCurrentMonth && day.assignment)
        .map((day) => day.assignment?.cycleName ?? day.assignment?.label ?? '')
        .filter((label) => label.trim() !== ''),
    ).size;
  }

  getMonthTemplateDayCount(): number {
    return this.getWeekSummaryTemplateDayCount();
  }

  getTemplateChipLabel(response: InputDayResponse | null): string | null {
    const title = response?.templateAssociation?.template.title?.trim();
    return title || null;
  }

  getTemplateSourceBadgeText(response: InputDayResponse | null): string | null {
    return getCalendarTemplateSourceBadgeText(
      response?.templateAssociation?.source,
    );
  }

  getPendingTemplateItemCount(response: InputDayResponse | null): number {
    return (response?.templateItems ?? []).filter(
      (item) => item.status === 'pending',
    ).length;
  }

  getDayTemplateItemCount(): number {
    return this.inputDayResponse()?.templateItems?.length ?? 0;
  }

  getDayPendingTemplateItemCount(): number {
    return this.getPendingTemplateItemCount(this.inputDayResponse());
  }

  getMonthDayTitle(day: CalendarDay): string {
    return (
      day.assignment?.cycleName ??
      day.assignment?.label ??
      this.getWeekDayResponse(day.date)?.templateAssociation?.template.title ??
      this.language.translate('Tracked day')
    );
  }

  getMonthDayType(day: CalendarDay): string {
    return day.assignment ? 'Active cycle' : 'Tracked day';
  }

  getMonthDayProgressText(day: CalendarDay): string | null {
    if (day.assignment?.dayNumber) {
      return this.language.translate('Day {p0}/{p1}', {
        p0: day.assignment.dayNumber, p1: day.assignment.totalDays,
      });
    }

    const source = this.getTemplateSourceBadgeText(this.getWeekDayResponse(day.date));
    return source === null ? null : this.language.translate(source);
  }

  getMonthDayAlertBadges(dateLocal: string): CalendarMonthAlertBadge[] {
    const response = this.getWeekDayResponse(dateLocal);
    if (!response) {
      return [];
    }

    return buildCalendarMonthAlertBadges(
      this.buildMacroComparisons(response),
      this.buildProjectedMacroComparisons(response),
      this.getPendingTemplateItemCount(response),
      this.language.locale(),
    );
  }

  getDayMetricEntries(
    metrics: Record<string, number | InputDayMacroValue> | null | undefined,
  ): CalendarMacroMetricEntry[] {
    return getCalendarMetricEntries(metrics, this.language.locale());
  }

  getDayTemplateTimelineBlocks(): CalendarWeekTimelineBlock[] {
    const response = this.inputDayResponse();
    const dateLocal = response?.dateLocal ?? this.currentDate.toISODate() ?? '';
    if (dateLocal.trim() === '') {
      return this.emptyWeekTimelineBlocks;
    }

    const slots = this.resolveTemplateSlotsForResponse(response);
    const plannedItems = this.resolvePendingTemplateItems(response, slots);

    return this.buildWeekTimelineBlocks(dateLocal, slots, [], plannedItems);
  }

  getDaySetTimelineBlocks(): CalendarWeekTimelineBlock[] {
    const response = this.inputDayResponse();
    const dateLocal = response?.dateLocal ?? this.currentDate.toISODate() ?? '';
    if (dateLocal.trim() === '') {
      return this.emptyWeekTimelineBlocks;
    }

    const slots = this.resolveDaySetSlotsForResponse(response);
    const insertedProducts = this.resolveCurrentDayInsertedProducts(
      dateLocal,
      slots,
    );

    return this.buildWeekTimelineBlocks(dateLocal, slots, insertedProducts);
  }

  getDayTemplateSlotCount(): number {
    return this.resolveTemplateSlotsForResponse(this.inputDayResponse()).length;
  }

  getDaySetSlotCount(): number {
    return this.resolveDaySetSlotsForResponse(this.inputDayResponse()).length;
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

  private buildCalendarAssignmentForDate(
    dateIso: string,
  ): CalendarAssignment | undefined {
    const assignment = this.findAssignmentForDate(dateIso);
    if (!assignment) {
      return undefined;
    }

    const startDate = DateTime.fromISO(assignment.startDateLocal).startOf(
      'day',
    );
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
    this.applyVisibleInputDayData();

    if (this.currentView !== 'day') {
      this.daySlots = [];
      this.clearDayInsertedProducts();
      return;
    }

    const entries = this.resolveItemsBySlotEntries();
    const slots = this.resolveDaySlots();
    this.applyDaySlots(slots);
    this.applyDayInsertedProducts(
      entries,
      this.inputDayResponse()?.items ?? [],
    );
  }

  getWeekDayResponse(dateLocal: string): InputDayResponse | null {
    return this.visibleDayResponseByDate.get(dateLocal) ?? null;
  }

  getWeekDaySlots(dateLocal: string): CalendarDaySlot[] {
    return this.visibleDaySlotsByDate.get(dateLocal) ?? this.emptySlots;
  }

  private getResponseEntryCount(response: InputDayResponse): number {
    return response.items.length + (response.externalEntries?.length ?? 0);
  }

  getWeekTimelineBlocks(dateLocal: string): CalendarWeekTimelineBlock[] {
    return (
      this.visibleTimelineBlocksByDate.get(dateLocal) ??
      this.emptyWeekTimelineBlocks
    );
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

  getDayHalfHourGridRowStart(hour: number, minute: 0 | 30): number {
    return 2 + hour * 2 + (minute === 30 ? 1 : 0);
  }

  trackByDate(_: number, day: CalendarDay): string {
    return day.date;
  }

  trackByHour(_: number, hour: number | HourSlot): number {
    return typeof hour === 'number' ? hour : hour.hour;
  }

  trackBySlot(_: number, slot: CalendarDaySlot): string {
    return buildCalendarSlotTrackKey(slot);
  }

  trackByInsertedProduct(_: number, product: CalendarInsertedProduct): number {
    return product.id;
  }

  trackByWeekMacro(_: number, macro: { key: string }): string {
    return macro.key;
  }

  trackByMonthAlertBadge(_: number, badge: CalendarMonthAlertBadge): string {
    return badge.key;
  }

  trackByMacroMetricEntry(_: number, entry: CalendarMacroMetricEntry): string {
    return entry.key;
  }

  trackByDayMacroCard(_: number, card: CalendarDayMacroCard): string {
    return card.key;
  }

  trackByDaySlotMacroGroup(
    _: number,
    group: CalendarDaySlotMacroGroup,
  ): string {
    return group.key;
  }

  trackByDayEntryRow(_: number, entry: CalendarDayEntryRow): number {
    return entry.id;
  }

  trackByWeekTimelineBlock(
    _: number,
    block: CalendarWeekTimelineBlock,
  ): string {
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
    const minute = block.startMinute % 60;
    this.onHourClick(
      {
        hour,
        label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        assignment: day.assignment,
      },
      day.date,
      minute,
    );
  }

  onDayTimelineBlockClick(
    block: CalendarWeekTimelineBlock,
    event: Event,
  ): void {
    event.stopPropagation();

    const dateLocal =
      this.inputDayResponse()?.dateLocal ?? this.currentDate.toISODate() ?? '';
    if (dateLocal.trim() === '') {
      return;
    }

    const hour = Math.max(0, Math.min(23, Math.floor(block.startMinute / 60)));
    const minute = block.startMinute % 60;
    this.onHourClick(
      {
        hour,
        label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      },
      dateLocal,
      minute,
    );
  }

  onDayHalfHourClick(hour: number, minute: 0 | 30): void {
    const normalizedHour = Math.max(0, Math.min(23, hour));
    const label = `${normalizedHour.toString().padStart(2, '0')}:${minute === 30 ? '30' : '00'}`;

    this.onHourClick(
      {
        hour: normalizedHour,
        label,
      },
      this.currentDate.toISODate() ?? '',
      minute,
    );
  }

  private applyVisibleInputDayData(): void {
    this.visibleDayResponseByDate.clear();
    this.visibleDaySlotsByDate.clear();
    this.visibleTimelineBlocksByDate.clear();

    this.resolveVisibleDayResponses().forEach((response) => {
      if (!response.dateLocal || response.dateLocal.trim() === '') {
        return;
      }

      this.visibleDayResponseByDate.set(response.dateLocal, response);

      const slots = this.resolveDaySetSlotsForResponse(response);
      this.visibleDaySlotsByDate.set(response.dateLocal, slots);

      const entries = this.resolveItemsBySlotEntriesForResponse(response);
      const insertedProducts = this.buildCalendarInsertedProducts(
        entries,
        response.items ?? [],
        response.dateLocal,
        slots,
      );

      this.visibleTimelineBlocksByDate.set(
        response.dateLocal,
        this.buildWeekTimelineBlocks(
          response.dateLocal,
          slots,
          insertedProducts,
        ),
      );
    });
  }

  private resolveVisibleDayResponses(): InputDayResponse[] {
    if (this.currentView === 'month') {
      return this.inputMonthResponse()?.days ?? [];
    }

    if (this.currentView === 'week') {
      const inputWeekResponse = this.inputWeekResponse();
      if (inputWeekResponse?.days && inputWeekResponse.days.length > 0) {
        return inputWeekResponse.days;
      }

      const inputDayResponse = this.inputDayResponse();
      if (inputDayResponse) {
        return [inputDayResponse];
      }
    }

    return [];
  }

  private resolveItemsBySlotEntries(): InputDayItemsBySlotEntry[] {
    return this.resolveItemsBySlotEntriesForResponse(
      this.inputDayResponse(),
      this.inputDayItemsBySlot(),
    );
  }

  private resolveItemsBySlotEntriesForResponse(
    response: InputDayResponse | null,
    fallbackEntries: InputDayItemsBySlotEntry[] = [],
  ): InputDayItemsBySlotEntry[] {
    return resolveCalendarItemsBySlotEntries(
      response,
      fallbackEntries,
      this.resolveDaySlotsForResponse(response),
      this.normalizeTimezone(),
    );
  }

  private resolveDaySlots(): CalendarDaySlot[] {
    return this.resolveDaySlotsForResponse(this.inputDayResponse());
  }

  private resolveDaySetSlotsForResponse(
    response: InputDayResponse | null,
  ): CalendarDaySlot[] {
    return resolveCalendarDaySetSlots(response);
  }

  private resolveTemplateSlotsForResponse(
    response: InputDayResponse | null,
  ): CalendarDaySlot[] {
    return resolveCalendarTemplateSlots(response, this.slotCatalog());
  }

  private resolveDaySlotsForResponse(
    response: InputDayResponse | null,
  ): CalendarDaySlot[] {
    return resolveCalendarDaySlots(response, this.slotCatalog());
  }

  private buildItemsBySlotEntriesFromResponse(
    response: InputDayResponse | null,
  ): InputDayItemsBySlotEntry[] {
    return buildCalendarItemsBySlotEntriesFromResponse(
      response,
      this.resolveDaySlotsForResponse(response),
      this.normalizeTimezone(),
    );
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
    return isCalendarSlotOverlappingHour(slot, hourStart, hourEnd);
  }

  private buildMacroHighlights(
    dayTotal: Record<string, InputDayMacroValue> | null,
  ): CalendarWeekMacroHighlight[] {
    return buildCalendarMacroHighlights(dayTotal, this.language.locale());
  }

  private buildMacroComparisons(
    response: InputDayResponse | null,
  ): CalendarMacroComparison[] {
    return this.buildMacroComparisonsFromTotals(response?.totalsMacros ?? null);
  }

  private buildProjectedMacroComparisons(
    response: InputDayResponse | null,
  ): CalendarMacroComparison[] {
    return this.buildMacroComparisonsFromTotals(
      response?.projectedTotalsMacros ?? null,
    );
  }

  private buildMacroComparisonsFromTotals(
    totals: InputDayTotalsMacrosSummary | null,
  ): CalendarMacroComparison[] {
    return buildCalendarMacroComparisonsFromTotals(totals, this.language.locale());
  }

  private hasTemplateData(response: InputDayResponse | null): boolean {
    return Boolean(
      response?.templateAssociation ||
      response?.projectedTotalsMacros ||
      (response?.templateItems?.length ?? 0) > 0,
    );
  }

  private formatQuantityLabel(value: number): string {
    return formatCalendarQuantityLabel(value, this.language.locale());
  }

  private buildDayMacroCards(
    consumedValues: Record<string, InputDayMacroValue> | null | undefined,
    targets: Record<string, number> | null | undefined,
    deltas: Record<string, InputDayMacroValue> | null | undefined,
  ): CalendarDayMacroCard[] {
    return buildCalendarDayMacroCards(consumedValues, targets, deltas, this.language.locale());
  }

  private resolveCurrentDayInsertedProducts(
    dateLocal: string,
    slots: CalendarDaySlot[],
  ): CalendarInsertedProduct[] {
    return this.buildCalendarInsertedProducts(
      this.resolveItemsBySlotEntries(),
      this.inputDayResponse()?.items ?? [],
      dateLocal,
      slots,
    );
  }

  private formatCompactNumber(
    value: number,
    maximumFractionDigits: number,
  ): string {
    return formatCalendarCompactNumber(value, maximumFractionDigits, this.language.locale());
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
      this.inputDayResponse()?.dateLocal ?? this.currentDate.toISODate() ?? '',
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
    return buildCalendarInsertedProductsByHour(
      entries,
      responseItems,
      dateLocal,
      slots,
      this.normalizeTimezone(),
    );
  }

  private buildCalendarInsertedProducts(
    entries: InputDayItemsBySlotEntry[],
    responseItems: InputDayItemSummary[],
    dateLocal: string,
    slots: CalendarDaySlot[],
  ): CalendarInsertedProduct[] {
    return buildCalendarInsertedProducts(
      entries,
      responseItems,
      dateLocal,
      slots,
      this.normalizeTimezone(),
    );
  }

  private buildWeekTimelineBlocks(
    dateLocal: string,
    slots: CalendarDaySlot[],
    insertedProducts: CalendarInsertedProduct[],
    plannedItems: CalendarPlannedTemplateItem[] = [],
  ): CalendarWeekTimelineBlock[] {
    return buildCalendarWeekTimelineBlocks(
      dateLocal,
      slots,
      insertedProducts,
      plannedItems,
      this.normalizeTimezone(),
    );
  }


  private resolvePendingTemplateItems(
    response: InputDayResponse | null,
    slots: CalendarDaySlot[],
  ): CalendarPlannedTemplateItem[] {
    return resolvePendingCalendarTemplateItems(response, slots, this.language.locale());
  }

  getDayTemplateBlockEmptyText(block: CalendarWeekTimelineBlock): string {
    const blockItems = (this.inputDayResponse()?.templateItems ?? []).filter(
      (item) => item.slotKey?.trim() === block.slotKey,
    );

    if (
      blockItems.length > 0 &&
      blockItems.every(
        (item) => item.status === 'converted' || item.convertedItemId !== null,
      )
    ) {
      return 'All entries were converted.';
    }

    return 'No template is planned for this time range.';
  }


  private buildOccurredAtForTime(
    dateLocal: string,
    hour: number,
    minute = 0,
  ): string | null {
    if (
      !dateLocal ||
      !Number.isInteger(hour) ||
      hour < 0 ||
      hour > 23 ||
      !Number.isInteger(minute) ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    const parsed = DateTime.fromISO(dateLocal, {
      zone: this.normalizeTimezone(),
    }).set({
      hour,
      minute,
      second: 0,
      millisecond: 0,
    });

    if (!parsed.isValid) {
      return null;
    }

    return parsed.toISO({ suppressMilliseconds: true });
  }

  private findAssignmentForDate(dateIso: string): CycleAssignment | undefined {
    return this.cycleAssignments().find((assignment) =>
      this.isDateInRange(
        dateIso,
        assignment.startDateLocal,
        assignment.endDateLocal,
      ),
    );
  }

  private clearDayInsertedProducts(): void {
    this.dayHours.forEach((hour) => {
      hour.insertedProducts = [];
    });
  }

  private isDateInRange(
    dateIso: string,
    startDateLocal: string,
    endDateLocal: string,
  ): boolean {
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
    const monthStart = this.resolveMonthStartDateTime(month).startOf('day');
    const monthEnd = monthStart.endOf('month').startOf('day');
    const startDate = DateTime.fromISO(assignment.startDateLocal).startOf(
      'day',
    );
    const endDate = DateTime.fromISO(assignment.endDateLocal).startOf('day');

    if (!startDate.isValid || !endDate.isValid) {
      return false;
    }

    return startDate <= monthEnd && endDate >= monthStart;
  }

  private resolveMonthStartDateTime(month: MonthSummary): DateTime<true> {
    const monthStart = DateTime.local(month.year, month.month, 1);

    if (monthStart.isValid) {
      return monthStart;
    }

    return DateTime.now().startOf('month');
  }

  private resolveCycleColorClass(color: string): string {
    return resolveCycleToneClass(color);
  }

  private normalizeTimezone(): string {
    return normalizeCalendarTimezone(this.inputDayTimezone());
  }

}
