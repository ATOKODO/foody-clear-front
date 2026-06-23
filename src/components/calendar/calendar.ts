// calendar-container.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
  InputMonthResponse,
  InputDayResponse,
  InputDaySlotSummary,
  InputDayTargetSource,
  InputDayTotalsMacrosSummary,
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

interface CalendarDayMacroCard {
  key: string;
  label: string;
  consumed: string;
  target: string;
  delta: string;
  unit: string;
  tone: 'energy' | 'proteins' | 'carbs' | 'lipids';
  status: 'under' | 'exact' | 'over' | 'neutral';
}

interface CalendarDayEntryRow {
  id: number;
  dateLocal: string;
  timeLabel: string;
  productName: string;
  qtyLabel: string;
  slotLabel: string;
  item: CalendarInsertedProduct;
}

interface CalendarMacroComparison {
  key: string;
  label: string;
  abbr: string;
  value: string;
  target: string;
  percentage: string;
  status: 'under' | 'exact' | 'over';
  unit: string;
  tone: 'energy' | 'proteins' | 'carbs' | 'lipids';
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

interface CalendarMonthAlertBadge {
  key: string;
  text: string;
  tone: 'over' | 'projected' | 'template';
}

@Component({
  selector: 'app-calendar',
  imports: [MatButtonModule, MatButtonToggleModule, DecimalPipe],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
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
  readonly showHeader = input(true);

  readonly dayClick = output<CalendarDayClickEvent>();
  readonly hourClick = output<CalendarHourClickEvent>();
  readonly monthClick = output<CalendarMonthClickEvent>();
  readonly manageItems = output<CalendarManageItemsEvent>();
  readonly manageAssignmentRequested = output<CalendarManageAssignmentEvent>({ alias: 'manageAssignment' });
  readonly itemClick = output<CalendarItemClickEvent>();
  readonly openDayViewRequested = output<CalendarOpenDayViewEvent>({ alias: 'openDayView' });
  readonly viewChanged = output<CalendarViewChangeEvent>();

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
  private visibleDayResponseByDate = new Map<string, InputDayResponse>();
  private visibleDaySlotsByDate = new Map<string, CalendarDaySlot[]>();
  private visibleTimelineBlocksByDate = new Map<string, CalendarWeekTimelineBlock[]>();
  private readonly emptySlots: CalendarDaySlot[] = [];
  private readonly emptyWeekTimelineBlocks: CalendarWeekTimelineBlock[] = [];
  private readonly weekMacroOrder = ['energyKcal', 'proteins', 'carbs', 'lipids'];
  private readonly monthMacroAlertLabels: Record<string, string> = {
    energyKcal: 'Kcal',
    proteins: 'P',
    carbs: 'G',
    lipids: 'L',
  };
  private readonly weekMacroDefinitions: Record<
    string,
    {
      label: string;
      abbr: string;
      unit: string;
      tone: CalendarWeekMacroHighlight['tone'];
    }
  > = {
    energyKcal: { label: 'Energie', abbr: 'kcal', unit: 'kcal', tone: 'energy' },
    proteins: { label: 'Proteines', abbr: 'P', unit: 'g', tone: 'proteins' },
    carbs: { label: 'Glucides', abbr: 'G', unit: 'g', tone: 'carbs' },
    lipids: { label: 'Lipides', abbr: 'L', unit: 'g', tone: 'lipids' },
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
      changes['inputMonthResponse'] ||
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

  openDayView(dateLocal: string): void {
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

  onHourClick(hour: HourSlot, dateLocal?: string, minute = 0): void {
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
      occurredAt: this.buildOccurredAtForTime(resolvedDateLocal, hour.hour, minute),
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
      dateLocal.trim() === '' ? null : (this.findAssignmentForDate(dateLocal) ?? null);

    this.manageItems.emit({
      view: this.currentView,
      currentDateIso: this.currentDate.toISO() ?? '',
      dateLocal,
      sourceAssignment,
    });
  }

  onManageAssignment(dateLocal: string): void {
    const sourceAssignment =
      dateLocal.trim() === '' ? null : (this.findAssignmentForDate(dateLocal) ?? null);

    this.manageAssignmentRequested.emit({
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

    this.openDayViewRequested.emit({ dateLocal });
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
      response?.templateAssociation ||
      response?.projectedTotalsMacros ||
      (response?.templateItems?.length ?? 0) > 0 ||
      response?.totalsMacros ||
      this.getWeekDaySlotCount(dateLocal) > 0 ||
      this.getWeekDayProductCount(dateLocal) > 0,
    );
  }

  getWeekSummaryDayCount(): number {
    return this.weekDays.filter((day) => this.hasWeekDaySummaryData(day)).length;
  }

  getWeekSummaryItemCount(): number {
    return Array.from(this.visibleDayResponseByDate.values()).reduce(
      (total, response) => total + response.items.length,
      0,
    );
  }

  getWeekSummaryTemplateDayCount(): number {
    return Array.from(this.visibleDayResponseByDate.values()).filter((response) =>
      this.hasTemplateData(response),
    ).length;
  }

  getWeekSummaryEnergyTotal(): string {
    const total = Array.from(this.visibleDayResponseByDate.values()).reduce((sum, response) => {
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
    return this.visibleDayResponseByDate.get(dateLocal)?.items.length ?? 0;
  }

  getWeekDaySlotCount(dateLocal: string): number {
    return this.getWeekDaySlots(dateLocal).length;
  }

  getWeekDayMacroComparisons(dateLocal: string): CalendarMacroComparison[] {
    return this.buildMacroComparisons(this.visibleDayResponseByDate.get(dateLocal) ?? null);
  }

  getWeekDayProjectedMacroComparisons(dateLocal: string): CalendarMacroComparison[] {
    return this.buildProjectedMacroComparisons(this.visibleDayResponseByDate.get(dateLocal) ?? null);
  }

  getMonthDayMacroComparisons(dateLocal: string): CalendarMacroComparison[] {
    return this.buildMacroComparisons(this.visibleDayResponseByDate.get(dateLocal) ?? null);
  }

  getMonthDayProjectedMacroComparisons(dateLocal: string): CalendarMacroComparison[] {
    return this.buildProjectedMacroComparisons(this.visibleDayResponseByDate.get(dateLocal) ?? null);
  }

  getDayMacroHighlights(): CalendarWeekMacroHighlight[] {
    return this.buildMacroHighlights(this.inputDayResponse()?.totalsMacros?.dayTotal ?? null);
  }

  getDayProjectedMacroHighlights(): CalendarWeekMacroHighlight[] {
    return this.buildMacroHighlights(this.inputDayResponse()?.projectedTotalsMacros?.dayTotal ?? null);
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

    const assignment = this.inputDayResponse()?.assignment;
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
    return this.inputDayResponse()?.items.length ?? 0;
  }

  getDaySlotCount(): number {
    return this.daySlots.length;
  }

  getDayEnergyTotal(): string {
    const energy = this.inputDayResponse()?.totalsMacros?.dayTotal['energyKcal'];
    return typeof energy === 'number' ? this.formatCompactNumber(energy, 0) : '0';
  }

  getDayTargetHeadline(): string {
    const targetSource = this.inputDayResponse()?.totalsMacros?.targetSource ?? 'none';

    if (targetSource === 'cycle') {
      return 'Cible du jour issue du cycle assigne';
    }

    if (targetSource === 'daySet') {
      return 'Cible du jour issue du day set';
    }

    return 'Aucune cible du jour resolue';
  }

  getDayTargetSupportingText(): string {
    const targetSource = this.inputDayResponse()?.totalsMacros?.targetSource ?? 'none';
    const assignmentTitle =
      this.getDayAssignmentHighlight()?.title ?? this.inputDayResponse()?.assignment?.cycleTitle ?? null;
    const daySetTitle = this.inputDayResponse()?.daySet?.title?.trim() ?? null;

    if (targetSource === 'cycle') {
      return assignmentTitle
        ? `Les entrees saisies sont comparees a la cible du cycle ${assignmentTitle}.`
        : 'Les entrees saisies sont comparees a la cible du cycle assigne.';
    }

    if (targetSource === 'daySet') {
      return daySetTitle
        ? `Les entrees saisies sont comparees au repere du day set ${daySetTitle}.`
        : 'Les entrees saisies sont comparees au repere nutritionnel du day set.';
    }

    return 'Le pilotage du jour affiche uniquement les entrees reellement saisies.';
  }

  getDayTargetSourcePillText(targetSource: InputDayTargetSource): string {
    if (targetSource === 'cycle') {
      return 'Cible cycle assigne';
    }

    if (targetSource === 'daySet') {
      return 'Cible day set';
    }

    return 'Sans cible';
  }

  getDayMacroCards(): CalendarDayMacroCard[] {
    const totals = this.inputDayResponse()?.totalsMacros ?? null;
    if (!totals) {
      return [];
    }

    const keys = new Set<string>([
      ...Object.keys(totals.dayTotal ?? {}),
      ...Object.keys(totals.targets ?? {}),
      ...Object.keys(totals.deltaToTargets ?? {}),
    ]);

    return Array.from(keys)
      .sort((leftKey, rightKey) => {
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
      })
      .map((key) => {
        const definition = this.weekMacroDefinitions[key];
        const consumed = totals.dayTotal?.[key];
        const target = totals.targets?.[key];
        const delta = totals.deltaToTargets?.[key];

        return {
          key,
          label: definition?.label ?? key,
          consumed: this.formatMetricValue(consumed ?? null),
          target: this.formatMetricValue(target ?? null),
          delta: this.formatSignedMetricValue(delta ?? null),
          unit: definition?.unit ?? '',
          tone: definition?.tone ?? 'energy',
          status: this.resolveDayMacroCardStatus(consumed, target, delta),
        };
      });
  }

  getDayEntryRows(): CalendarDayEntryRow[] {
    const dateLocal = this.inputDayResponse()?.dateLocal ?? this.currentDate.toISODate() ?? '';
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
      slotLabel: item.slotTitle || item.slotKey || 'Sans slot',
      item,
    }));
  }

  getProjectedDayEnergyTotal(): string {
    const energy = this.inputDayResponse()?.projectedTotalsMacros?.dayTotal['energyKcal'];
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

  getMonthTemplateDayCount(): number {
    return Array.from(this.visibleDayResponseByDate.values()).filter((response) =>
      this.hasTemplateData(response),
    ).length;
  }

  getTemplateChipLabel(response: InputDayResponse | null): string | null {
    const title = response?.templateAssociation?.template.title?.trim();
    return title ? title : null;
  }

  getTemplateSourceBadgeText(response: InputDayResponse | null): string | null {
    const source = response?.templateAssociation?.source;
    if (source === 'manual') {
      return 'Template manuel';
    }

    if (source === 'daySet') {
      return 'Template day-set';
    }

    return null;
  }

  getPendingTemplateItemCount(response: InputDayResponse | null): number {
    return (response?.templateItems ?? []).filter((item) => item.status === 'pending').length;
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
      'Jour suivi'
    );
  }

  getMonthDayType(day: CalendarDay): string {
    return day.assignment ? 'Cycle actif' : 'Jour suivi';
  }

  getMonthDayProgressText(day: CalendarDay): string | null {
    if (day.assignment?.dayNumber) {
      return `Jour ${day.assignment.dayNumber}/${day.assignment.totalDays}`;
    }

    return this.getTemplateSourceBadgeText(this.getWeekDayResponse(day.date));
  }

  getMonthDayAlertBadges(dateLocal: string): CalendarMonthAlertBadge[] {
    const response = this.getWeekDayResponse(dateLocal);
    if (!response) {
      return [];
    }

    const actualComparisons = new Map(
      this.buildMacroComparisons(response).map((comparison) => [comparison.key, comparison]),
    );
    const projectedComparisons = new Map(
      this.buildProjectedMacroComparisons(response).map((comparison) => [comparison.key, comparison]),
    );
    const badges = this.weekMacroOrder.reduce<CalendarMonthAlertBadge[]>((accumulator, key) => {
      const macroLabel = this.monthMacroAlertLabels[key] ?? key;
      const actualComparison = actualComparisons.get(key);
      if (actualComparison?.status === 'over') {
        accumulator.push({
          key: `${key}-actual`,
          text: `${macroLabel} depasse`,
          tone: 'over',
        });
        return accumulator;
      }

      const projectedComparison = projectedComparisons.get(key);
      if (projectedComparison?.status === 'over') {
        accumulator.push({
          key: `${key}-projected`,
          text: `${macroLabel} projete depasse`,
          tone: 'projected',
        });
      }

      return accumulator;
    }, []);

    const pendingTemplateItems = this.getPendingTemplateItemCount(response);
    if (pendingTemplateItems > 0) {
      badges.push({
        key: 'template-pending',
        text:
          pendingTemplateItems === 1
            ? 'Template en attente'
            : `${pendingTemplateItems} templates en attente`,
        tone: 'template',
      });
    }

    return badges;
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
    const dateLocal = this.inputDayResponse()?.dateLocal ?? this.currentDate.toISODate() ?? '';
    if (dateLocal.trim() === '') {
      return this.emptyWeekTimelineBlocks;
    }

    const slots = this.resolveDaySlots();
    const insertedProducts = this.resolveCurrentDayInsertedProducts(dateLocal, slots);

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
    this.applyVisibleInputDayData();

    if (this.currentView !== 'day') {
      this.daySlots = [];
      this.clearDayInsertedProducts();
      return;
    }

    const entries = this.resolveItemsBySlotEntries();
    const slots = this.resolveDaySlots();
    this.applyDaySlots(slots);
    this.applyDayInsertedProducts(entries, this.inputDayResponse()?.items ?? []);
  }

  getWeekDayResponse(dateLocal: string): InputDayResponse | null {
    return this.visibleDayResponseByDate.get(dateLocal) ?? null;
  }

  getWeekDaySlots(dateLocal: string): CalendarDaySlot[] {
    return this.visibleDaySlotsByDate.get(dateLocal) ?? this.emptySlots;
  }

  getWeekTimelineBlocks(dateLocal: string): CalendarWeekTimelineBlock[] {
    return this.visibleTimelineBlocksByDate.get(dateLocal) ?? this.emptyWeekTimelineBlocks;
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
    return `${slot.slotId ?? slot.slotKey ?? slot.title}-${slot.startTime ?? ''}-${slot.endTime ?? ''}`;
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

  trackByDayEntryRow(_: number, entry: CalendarDayEntryRow): number {
    return entry.id;
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

    const dateLocal = this.inputDayResponse()?.dateLocal ?? this.currentDate.toISODate() ?? '';
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

      const slots = this.resolveDaySlotsForResponse(response);
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
        this.buildWeekTimelineBlocks(response.dateLocal, slots, insertedProducts),
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
    if (response?.itemsBySlot && response.itemsBySlot.length > 0) {
      return response.itemsBySlot;
    }

    if (fallbackEntries.length > 0) {
      return fallbackEntries;
    }

    return this.buildItemsBySlotEntriesFromResponse(response);
  }

  private resolveDaySlots(): CalendarDaySlot[] {
    return this.resolveDaySlotsForResponse(this.inputDayResponse());
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

  private buildMacroComparisons(response: InputDayResponse | null): CalendarMacroComparison[] {
    return this.buildMacroComparisonsFromTotals(response?.totalsMacros ?? null);
  }

  private buildProjectedMacroComparisons(
    response: InputDayResponse | null,
  ): CalendarMacroComparison[] {
    return this.buildMacroComparisonsFromTotals(response?.projectedTotalsMacros ?? null);
  }

  private buildMacroComparisonsFromTotals(
    totals: InputDayTotalsMacrosSummary | null,
  ): CalendarMacroComparison[] {
    const dayTotal = totals?.dayTotal ?? null;
    const targets = totals?.targets ?? null;
    if (!dayTotal || !targets) {
      return [];
    }

    return this.weekMacroOrder.flatMap((key) => {
      const definition = this.weekMacroDefinitions[key];
      const value = dayTotal[key];
      const target = targets[key];
      if (!definition || typeof value !== 'number' || typeof target !== 'number') {
        return [];
      }

      const normalizedValue = this.roundComparisonNumber(value);
      const normalizedTarget = this.roundComparisonNumber(target);
      const percentage =
        normalizedTarget > 0
          ? this.roundComparisonNumber((normalizedValue / normalizedTarget) * 100)
          : null;

      return [
        {
          key,
          label: definition.label,
          abbr: definition.abbr,
          value: this.formatMetricValue(normalizedValue),
          target: this.formatMetricValue(normalizedTarget),
          percentage: this.formatComparisonPercentage(percentage),
          status: this.resolveMacroComparisonStatus(normalizedValue, normalizedTarget),
          unit: definition.unit,
          tone: definition.tone,
        },
      ];
    });
  }

  private hasTemplateData(response: InputDayResponse | null): boolean {
    return Boolean(
      response?.templateAssociation ||
      response?.projectedTotalsMacros ||
      (response?.templateItems?.length ?? 0) > 0,
    );
  }

  private resolveMacroComparisonStatus(
    value: number,
    target: number,
  ): CalendarMacroComparison['status'] {
    if (target === 0) {
      return value > 0 ? 'over' : 'exact';
    }

    if (value > target) {
      return 'over';
    }

    if (value === target) {
      return 'exact';
    }

    return 'under';
  }

  private formatComparisonPercentage(percentage: number | null): string {
    if (percentage === null) {
      return 'Cible 0';
    }

    return `${this.formatCompactNumber(percentage, 2)}%`;
  }

  private roundComparisonNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private formatMetricValue(
    value: number | InputDayMacroValue | null | undefined,
  ): string {
    if (typeof value === 'number') {
      return this.formatCompactNumber(value, Math.abs(value) >= 100 ? 0 : 1);
    }

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }

    return '--';
  }

  private formatSignedMetricValue(
    value: number | InputDayMacroValue | null | undefined,
  ): string {
    if (typeof value === 'number') {
      const formatted = this.formatCompactNumber(
        value,
        Math.abs(value) >= 100 ? 0 : 1,
      );
      return value > 0 ? `+${formatted}` : formatted;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }

    return '--';
  }

  private formatQuantityLabel(value: number): string {
    return this.formatCompactNumber(value, Math.abs(value) >= 100 ? 0 : 2);
  }

  private resolveDayMacroCardStatus(
    consumed: InputDayMacroValue | undefined,
    target: number | undefined,
    delta: InputDayMacroValue | undefined,
  ): CalendarDayMacroCard['status'] {
    if (typeof delta === 'number') {
      if (delta === 0) {
        return 'exact';
      }

      return delta > 0 ? 'over' : 'under';
    }

    if (typeof consumed === 'number' && typeof target === 'number') {
      return this.resolveMacroComparisonStatus(consumed, target);
    }

    return 'neutral';
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

    const parsed = DateTime.fromISO(dateLocal, { zone: this.normalizeTimezone() }).set({
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
    const monthStart = this.resolveMonthStartDateTime(month).startOf('day');
    const monthEnd = monthStart.endOf('month').startOf('day');
    const startDate = DateTime.fromISO(assignment.startDateLocal).startOf('day');
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
    const candidate = this.inputDayTimezone().trim() || 'UTC';
    return DateTime.now().setZone(candidate).isValid ? candidate : 'UTC';
  }
}
