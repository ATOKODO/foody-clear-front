import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  viewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { DateTime } from 'luxon';
import {
  Calendar,
  CalendarConvertTemplateItemEvent,
  CalendarDayClickEvent,
  CalendarHourClickEvent,
  CalendarItemClickEvent,
  CalendarRevertTemplateItemEvent,
  CalendarManageAssignmentEvent,
  CalendarManageItemsEvent,
  CalendarMonthClickEvent,
  CalendarOpenDayViewEvent,
  CalendarViewChangeEvent,
} from '../../components/calendar/calendar';
import {
  CycleListItem,
  ListCycle,
} from '../../components/cycle/list-cycle/list-cycle';
import { buildCycleListItem } from '../../components/cycle/list-cycle/cycle-list-item.mapper';
import { CycleAssignment } from '../../interfaces/cycle-assignment.interface';
import { Cycle } from '../../interfaces/cycle.interface';
import { CalendarView } from '../../interfaces/calendar.interface';
import { Slot } from '../../interfaces/slot.interface';
import {
  InputDayItemsBySlotEntry,
  InputMonthResponse,
  InputDayResponse,
  InputWeekResponse,
} from '../../interfaces/input-day.interface';
import { CycleAssignementService } from '../../services/cycle-assignement-service';
import { CycleService } from '../../services/cycle-service';
import { ExternalMealEntryDialogService } from '../../services/external-meal-entry-dialog-service';
import { InputDayService } from '../../services/input-day-service';
import { SlotService } from '../../services/slot-service';
import { InputDayFeature } from '../input-day/input-day.feature';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from '../../app/ui/segmented-toggle/segmented-toggle';

type PlanningCalendarController = Pick<
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

const PLANNING_CALENDAR_VIEW_OPTIONS: readonly SegmentedToggleOption<CalendarView>[] =
  [
    { value: 'day', label: 'Jour', testId: 'planning-view-day' },
    { value: 'week', label: 'Semaine', testId: 'planning-view-week' },
    { value: 'month', label: 'Mois', testId: 'planning-view-month' },
    { value: 'year', label: 'Année', testId: 'planning-view-year' },
  ];

const AUTO_REFRESH_THROTTLE_MS = 30_000;
const PLANNING_DATA_CACHE_MS = 60_000;

@Component({
  selector: 'app-planning',
  imports: [
    FormsModule,
    Calendar,
    InputDayFeature,
    ListCycle,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    SegmentedToggle,
    UiErrorPanel,
    DatePipe,
  ],
  templateUrl: './planning.feature.html',
  styleUrl: './planning.feature.scss',
  host: {
    '(window:focus)': 'onWindowFocus()',
    '(document:visibilitychange)': 'onVisibilityChange()',
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class PlanningFeature implements OnInit, AfterViewInit {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly externalMealEntryDialog = inject(ExternalMealEntryDialogService);
  private readonly cycleService = inject(CycleService);
  private readonly cycleAssignmentService = inject(CycleAssignementService);
  private readonly inputDayService = inject(InputDayService);
  private readonly slotService = inject(SlotService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly calendarRef =
    viewChild<PlanningCalendarController>('calendarRef');

  baseUrl = '';

  private readonly loadingCyclesState = signal(false);
  private readonly loadingAssignmentsState = signal(false);
  private readonly loadingDayItemsState = signal(false);
  private readonly savingAssignmentState = signal(false);

  cycles: Cycle[] = [];
  cycleAssignments: CycleAssignment[] = [];
  inputDayResponse: InputDayResponse | null = null;
  inputWeekResponse: InputWeekResponse | null = null;
  inputMonthResponse: InputMonthResponse | null = null;
  inputDayItemsBySlot: InputDayItemsBySlotEntry[] = [];
  slots: Slot[] = [];
  inputDayTimezone = DateTime.local().zoneName || 'UTC';
  readonly calendarViewOptions = PLANNING_CALENDAR_VIEW_OPTIONS;
  readonly initialCalendarDateLocal = this.resolveInitialCalendarDateLocal();
  readonly initialCalendarView = this.resolveInitialCalendarView();
  calendarHeaderLabel = 'Chargement...';

  currentCalendarView: CalendarView = this.initialCalendarView;
  currentAnchorDateLocal: string | null = null;
  currentRangeFromLocal: string | null = null;
  currentRangeToLocal: string | null = null;

  private readonly activeModalState = signal<
    'actions' | 'assignment' | 'items' | null
  >(null);
  clickedDateLocal = '';
  selectedModalDateLocal = '';
  selectedOccurredAt: string | null = null;
  selectedItemId: number | null = null;
  modalStartDateLocal = '';
  modalSelectedCycleId: number | null = null;
  editingAssignment: CycleAssignment | null = null;
  selectedActionAssignment: CycleAssignment | null = null;

  modalError: unknown = null;
  dayItemsError: unknown = null;
  lastResponse: unknown = null;
  lastError: unknown = null;
  lastResponseText = 'null';
  lastErrorText = '';
  private inputDayRequestId = 0;
  private lastAutomaticRefreshAt = 0;
  private cyclesRequestInFlight = false;
  private lastCyclesLoadedAt = 0;
  private slotsRequestInFlight = false;
  private lastSlotsLoadedAt = 0;
  private assignmentsRequestKey: string | null = null;
  private lastAssignmentsLoadedKey: string | null = null;
  private lastAssignmentsLoadedAt = 0;
  private inputDataRequestKey: string | null = null;
  private lastInputDataLoadedKey: string | null = null;
  private lastInputDataLoadedAt = 0;
  private hasHandledInitialCalendarData = false;
  private calendarViewReady = false;
  private requestedCalendarView: CalendarView = this.initialCalendarView;
  private requestedCalendarDateLocal = this.initialCalendarDateLocal;

  get loadingCycles(): boolean {
    return this.loadingCyclesState();
  }

  set loadingCycles(value: boolean) {
    this.loadingCyclesState.set(value);
  }

  get loadingAssignments(): boolean {
    return this.loadingAssignmentsState();
  }

  set loadingAssignments(value: boolean) {
    this.loadingAssignmentsState.set(value);
  }

  get loadingDayItems(): boolean {
    return this.loadingDayItemsState();
  }

  set loadingDayItems(value: boolean) {
    this.loadingDayItemsState.set(value);
  }

  get savingAssignment(): boolean {
    return this.savingAssignmentState();
  }

  set savingAssignment(value: boolean) {
    this.savingAssignmentState.set(value);
  }

  get activeModal(): 'actions' | 'assignment' | 'items' | null {
    return this.activeModalState();
  }

  set activeModal(value: 'actions' | 'assignment' | 'items' | null) {
    this.activeModalState.set(value);
  }

  ngOnInit(): void {
    this.baseUrl = this.cycleAssignmentService.baseUrl;
    this.cycleService.setBaseUrl(this.baseUrl);
    this.inputDayService.setBaseUrl(this.baseUrl);
    this.slotService.setBaseUrl(this.baseUrl);
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParamMap) => {
        this.updateRequestedCalendarState(queryParamMap);
        if (this.calendarViewReady) {
          this.applyRouteCalendarState();
        }
      });
    this.refreshPlanningData(true, { includeCycles: false });
  }

  ngAfterViewInit(): void {
    this.calendarViewReady = true;
    this.syncCalendarHeaderState();
    this.applyRouteCalendarState();
    this.changeDetectorRef.detectChanges();
  }

  onBaseUrlChange(): void {
    this.cycleService.setBaseUrl(this.baseUrl);
    this.cycleAssignmentService.setBaseUrl(this.baseUrl);
    this.inputDayService.setBaseUrl(this.baseUrl);
    this.slotService.setBaseUrl(this.baseUrl);
    this.invalidatePlanningDataCache();
    this.refreshPlanningData(true, { includeCycles: false });
  }

  onWindowFocus(): void {
    this.refreshPlanningData();
  }

  onVisibilityChange(): void {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      this.refreshPlanningData();
    }
  }

  onEscapeKey(): void {
    this.closeActiveModal();
  }

  onCalendarViewChanged(event: CalendarViewChangeEvent): void {
    const isInitialCalendarEvent = !this.hasHandledInitialCalendarData;

    this.currentCalendarView = event.view;
    this.currentAnchorDateLocal = event.anchorDateLocal;
    this.currentRangeFromLocal = event.fromDateLocal;
    this.currentRangeToLocal = event.toDateLocal;
    this.hasHandledInitialCalendarData = true;
    this.syncCalendarHeaderState();
    this.loadAssignmentsInRange(event.fromDateLocal, event.toDateLocal);

    if (isInitialCalendarEvent && event.view === 'month') {
      this.deferInitialInputDataForView(event);
      return;
    }

    this.loadInputDataForView(event);
  }

  goToCalendarToday(): void {
    this.calendarRef()?.goToToday();
    this.syncCalendarHeaderState();
  }

  navigateCalendar(direction: 'prev' | 'next'): void {
    this.calendarRef()?.navigate(direction);
    this.syncCalendarHeaderState();
  }

  switchCalendarView(view: CalendarView | string | null): void {
    if (!view) {
      return;
    }

    this.calendarRef()?.switchView(view as CalendarView);
    this.syncCalendarHeaderState();
  }

  getCalendarViewLabel(view: CalendarView): string {
    return (
      this.calendarRef()?.getViewLabel(view) ??
      this.getFallbackCalendarViewLabel(view)
    );
  }

  get showPlanningStatus(): boolean {
    return (
      this.loadingCycles ||
      this.loadingAssignments ||
      this.loadingDayItems ||
      this.savingAssignment
    );
  }

  onCalendarDayClick(event: CalendarDayClickEvent): void {
    this.openActionsModal(event.day.date, null, event.sourceAssignment);
  }

  onCalendarHourClick(event: CalendarHourClickEvent): void {
    const dateLocal =
      event.dateLocal.trim() !== ''
        ? event.dateLocal
        : (DateTime.fromISO(event.currentDateIso).toISODate() ?? '');

    if (event.view === 'day' || event.view === 'week') {
      this.openItemsModal(dateLocal, event.occurredAt, null);
      return;
    }

    this.openActionsModal(dateLocal, event.occurredAt, event.sourceAssignment);
  }

  onCalendarMonthClick(event: CalendarMonthClickEvent): void {
    const sourceAssignment =
      event.sourceAssignments.length === 1 ? event.sourceAssignments[0] : null;

    this.openActionsModal(event.dateLocal, null, sourceAssignment);
  }

  onCalendarManageItems(event: CalendarManageItemsEvent): void {
    this.openItemsModal(event.dateLocal, null, null);
  }

  onCalendarManageAssignment(event: CalendarManageAssignmentEvent): void {
    this.openAssignmentModal(event.dateLocal, event.sourceAssignment);
  }

  onCalendarOpenDayView(event: CalendarOpenDayViewEvent): void {
    this.calendarRef()?.activateDayView(event.dateLocal);
    this.syncCalendarHeaderState();
  }

  onCalendarItemClick(event: CalendarItemClickEvent): void {
    this.openItemsModal(event.dateLocal, null, event.item.id);
  }

  onCalendarConvertTemplateItem(event: CalendarConvertTemplateItemEvent): void {
    this.loadingDayItems = true;
    this.dayItemsError = null;

    this.inputDayService
      .convertTemplateItem(event.dateLocal, event.templateItemId, [event.inventoryId])
      .subscribe({
        next: (response) => {
          this.setLastResponse(response);
          this.setLastError(null);
          this.inputDayResponse = response;
          this.loadingDayItems = false;
          this.reloadInputDataForCurrentView();
        },
        error: (error) => {
          this.dayItemsError = error;
          this.setLastError(error);
          this.loadingDayItems = false;
        },
      });
  }

  onCalendarRevertTemplateItem(event: CalendarRevertTemplateItemEvent): void {
    this.loadingDayItems = true;
    this.dayItemsError = null;

    this.inputDayService.removeItem(event.dateLocal, event.itemId).subscribe({
      next: () => {
        this.setLastResponse({ reverted: true, itemId: event.itemId });
        this.setLastError(null);
        this.loadingDayItems = false;
        this.reloadInputDataForCurrentView();
      },
      error: (error) => {
        this.dayItemsError = error;
        this.setLastError(error);
        this.loadingDayItems = false;
      },
    });
  }

  onModalCycleSelected(item: CycleListItem): void {
    this.modalSelectedCycleId = item.id;
  }

  get cycleListItems(): CycleListItem[] {
    return this.cycles.map((cycle) => buildCycleListItem(cycle));
  }

  get modalSelectedIds(): number[] {
    return this.modalSelectedCycleId === null
      ? []
      : [this.modalSelectedCycleId];
  }

  get canSubmitModal(): boolean {
    return (
      this.modalSelectedCycleId !== null &&
      this.isDateLocal(this.modalStartDateLocal) &&
      this.cycles.some((cycle) => cycle.id === this.modalSelectedCycleId)
    );
  }

  closeAssignmentModal(): void {
    this.closeActiveModal();
  }

  openAssignmentFromActions(): void {
    this.openAssignmentModal(
      this.selectedModalDateLocal,
      this.selectedActionAssignment,
    );
  }

  openItemsFromActions(): void {
    this.openItemsModal(
      this.selectedModalDateLocal,
      this.selectedOccurredAt,
      null,
    );
  }

  openExternalEntryFromActions(): void {
    this.openExternalMealEntry(
      this.selectedModalDateLocal,
      this.selectedOccurredAt,
    );
  }

  openExternalEntryFromItems(): void {
    this.openExternalMealEntry(
      this.selectedModalDateLocal,
      this.selectedOccurredAt,
    );
  }

  closeActiveModal(): void {
    if (this.savingAssignment) {
      return;
    }

    this.resetModalState();
  }

  saveAssignmentFromModal(): void {
    if (!this.canSubmitModal || this.modalSelectedCycleId === null) {
      return;
    }

    const selectedCycle = this.cycles.find(
      (cycle) => cycle.id === this.modalSelectedCycleId,
    );
    if (!selectedCycle) {
      return;
    }

    const payload = {
      cycleId: selectedCycle.id,
      startDateLocal: this.modalStartDateLocal,
    };

    this.savingAssignment = true;
    this.modalError = null;

    if (this.editingAssignment) {
      this.cycleAssignmentService
        .update(this.editingAssignment.id, payload)
        .subscribe({
          next: (response) => {
            this.onMutationSuccess(response);
          },
          error: (error) => {
            this.onMutationError(error);
          },
        });
      return;
    }

    this.cycleAssignmentService.create(payload).subscribe({
      next: (response) => {
        this.onMutationSuccess(response);
      },
      error: (error) => {
        this.onMutationError(error);
      },
    });
  }

  removeAssignmentFromModal(): void {
    if (!this.editingAssignment) {
      return;
    }

    this.savingAssignment = true;
    this.modalError = null;

    this.cycleAssignmentService.remove(this.editingAssignment.id).subscribe({
      next: () => {
        this.onMutationSuccess({
          removed: true,
          id: this.editingAssignment?.id,
        });
      },
      error: (error) => {
        this.onMutationError(error);
      },
    });
  }

  onEmbeddedItemsChanged(): void {
    this.reloadInputDataForCurrentView(true);
  }

  refreshPlanningData(
    force = false,
    options: { includeCycles?: boolean } = {},
  ): void {
    if (!force && this.shouldThrottleAutomaticRefresh()) {
      return;
    }

    if (options.includeCycles ?? true) {
      this.loadCycles(force);
    }
    this.loadSlots(force);
    this.reloadAssignmentsForCurrentRange(force);
    this.reloadInputDataForCurrentView(force);
  }

  private loadSlots(force = false): void {
    if (!force && this.shouldUseRecentData(this.lastSlotsLoadedAt)) {
      return;
    }

    if (this.slotsRequestInFlight) {
      return;
    }

    this.slotsRequestInFlight = true;

    this.slotService.findAll().subscribe({
      next: (response) => {
        this.slots = response;
        this.lastSlotsLoadedAt = Date.now();
        this.slotsRequestInFlight = false;
      },
      error: (error) => {
        this.slots = [];
        this.setLastError(error);
        this.slotsRequestInFlight = false;
      },
    });
  }

  private loadCycles(force = false): void {
    if (!force && this.shouldUseRecentData(this.lastCyclesLoadedAt)) {
      return;
    }

    if (this.cyclesRequestInFlight) {
      return;
    }

    this.loadingCycles = true;
    this.cyclesRequestInFlight = true;

    this.cycleService.findAll().subscribe({
      next: (response) => {
        this.cycles = response;
        this.lastCyclesLoadedAt = Date.now();
        this.loadingCycles = false;
        this.cyclesRequestInFlight = false;
        this.setLastError(null);
      },
      error: (error) => {
        this.setLastError(error);
        this.loadingCycles = false;
        this.cyclesRequestInFlight = false;
      },
    });
  }

  private loadAssignmentsInRange(
    fromDateLocal: string,
    toDateLocal: string,
    force = false,
  ): void {
    if (!this.isDateLocal(fromDateLocal) || !this.isDateLocal(toDateLocal)) {
      return;
    }

    const requestKey = `${fromDateLocal}:${toDateLocal}`;
    if (this.assignmentsRequestKey === requestKey) {
      return;
    }

    if (
      !force &&
      this.lastAssignmentsLoadedKey === requestKey &&
      this.shouldUseRecentData(this.lastAssignmentsLoadedAt)
    ) {
      return;
    }

    this.loadingAssignments = true;
    this.assignmentsRequestKey = requestKey;

    this.cycleAssignmentService
      .findInRange(fromDateLocal, toDateLocal)
      .subscribe({
        next: (response) => {
          this.cycleAssignments = response;
          this.lastAssignmentsLoadedKey = requestKey;
          this.lastAssignmentsLoadedAt = Date.now();
          this.setLastResponse(response);
          this.setLastError(null);
          this.loadingAssignments = false;
          this.assignmentsRequestKey = null;
        },
        error: (error) => {
          this.setLastError(error);
          this.loadingAssignments = false;
          this.assignmentsRequestKey = null;
        },
      });
  }

  private reloadAssignmentsForCurrentRange(force = false): void {
    if (!this.currentRangeFromLocal || !this.currentRangeToLocal) {
      return;
    }

    this.loadAssignmentsInRange(
      this.currentRangeFromLocal,
      this.currentRangeToLocal,
      force,
    );
  }

  private reloadInputDataForCurrentView(force = false): void {
    if (!this.currentAnchorDateLocal) {
      return;
    }

    if (this.currentCalendarView === 'day') {
      this.loadInputDay(this.currentAnchorDateLocal, force);
      return;
    }

    if (this.currentCalendarView === 'month' && this.currentRangeFromLocal) {
      this.loadInputMonth(this.currentRangeFromLocal, force);
      return;
    }

    if (this.currentCalendarView === 'week' && this.currentRangeFromLocal) {
      this.loadInputWeek(this.currentRangeFromLocal, force);
      return;
    }

    this.clearInputDayState();
  }

  private deferInitialInputDataForView(event: CalendarViewChangeEvent): void {
    const scheduledEvent = { ...event };
    const load = () => {
      if (
        this.currentCalendarView !== scheduledEvent.view ||
        this.currentAnchorDateLocal !== scheduledEvent.anchorDateLocal ||
        this.currentRangeFromLocal !== scheduledEvent.fromDateLocal ||
        this.currentRangeToLocal !== scheduledEvent.toDateLocal
      ) {
        return;
      }

      this.loadInputDataForView(scheduledEvent);
    };

    if (typeof window === 'undefined') {
      load();
      return;
    }

    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
    };

    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(load, { timeout: 1500 });
      return;
    }

    window.setTimeout(load, 250);
  }

  private loadInputDataForView(event: CalendarViewChangeEvent): void {
    if (event.view === 'day') {
      this.loadInputDay(event.anchorDateLocal);
      return;
    }

    if (event.view === 'month') {
      this.loadInputMonth(event.fromDateLocal);
      return;
    }

    if (event.view === 'week') {
      this.loadInputWeek(event.fromDateLocal);
      return;
    }

    this.clearInputDayState();
  }

  private loadInputDay(dateLocal: string, force = false): void {
    if (!this.isDateLocal(dateLocal)) {
      this.clearInputDayState();
      return;
    }

    const timezone = this.resolveTimezone();
    const requestKey = `day:${dateLocal}:${timezone}`;
    if (this.shouldSkipInputDataRequest(requestKey, force)) {
      return;
    }

    const requestId = ++this.inputDayRequestId;
    this.loadingDayItems = true;
    this.inputDataRequestKey = requestKey;
    this.dayItemsError = null;
    this.inputDayResponse = null;
    this.inputMonthResponse = null;
    this.inputWeekResponse = null;
    this.inputDayItemsBySlot = [];

    this.inputDayService
      .getInputDay(dateLocal, timezone)
      .subscribe({
        next: (response) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }
          this.inputDayResponse = response;
          this.inputDayTimezone =
            response.timezone?.trim() || timezone;
          this.inputDayItemsBySlot = response.itemsBySlot ?? [];
          this.markInputDataLoaded(requestKey);
          this.loadingDayItems = false;
          this.inputDataRequestKey = null;
        },
        error: (error) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }
          this.inputDayResponse = null;
          this.inputWeekResponse = null;
          this.inputDayItemsBySlot = [];
          this.dayItemsError = error;
          this.loadingDayItems = false;
          this.inputDataRequestKey = null;
        },
      });
  }

  private loadInputMonth(dateLocal: string, force = false): void {
    if (!this.isDateLocal(dateLocal)) {
      this.clearInputDayState();
      return;
    }

    const timezone = this.resolveTimezone();
    const requestKey = `month:${dateLocal}:${timezone}`;
    if (this.shouldSkipInputDataRequest(requestKey, force)) {
      return;
    }

    const requestId = ++this.inputDayRequestId;
    this.loadingDayItems = true;
    this.inputDataRequestKey = requestKey;
    this.dayItemsError = null;
    this.inputDayResponse = null;
    this.inputMonthResponse = null;
    this.inputWeekResponse = null;
    this.inputDayItemsBySlot = [];

    this.inputDayService
      .getInputMonth(dateLocal, timezone)
      .subscribe({
        next: (response) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }

          this.inputMonthResponse = response;
          this.inputDayTimezone =
            response.timezone?.trim() || timezone;
          this.markInputDataLoaded(requestKey);
          this.loadingDayItems = false;
          this.inputDataRequestKey = null;
        },
        error: (error) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }

          this.inputMonthResponse = null;
          this.inputDayItemsBySlot = [];
          this.dayItemsError = error;
          this.loadingDayItems = false;
          this.inputDataRequestKey = null;
        },
      });
  }

  private loadInputWeek(startDateLocal: string, force = false): void {
    if (!this.isDateLocal(startDateLocal)) {
      this.clearInputDayState();
      return;
    }

    const timezone = this.resolveTimezone();
    const requestKey = `week:${startDateLocal}:${timezone}`;
    if (this.shouldSkipInputDataRequest(requestKey, force)) {
      return;
    }

    const requestId = ++this.inputDayRequestId;
    this.loadingDayItems = true;
    this.inputDataRequestKey = requestKey;
    this.dayItemsError = null;
    this.inputMonthResponse = null;
    this.inputDayResponse = null;
    this.inputWeekResponse = null;
    this.inputDayItemsBySlot = [];

    this.inputDayService
      .getInputWeek(startDateLocal, timezone)
      .subscribe({
        next: (response) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }

          this.inputWeekResponse = response;
          this.inputDayTimezone =
            response.timezone?.trim() || timezone;
          this.markInputDataLoaded(requestKey);
          this.loadingDayItems = false;
          this.inputDataRequestKey = null;
        },
        error: (error) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }

          this.inputWeekResponse = null;
          this.inputDayItemsBySlot = [];
          this.dayItemsError = error;
          this.loadingDayItems = false;
          this.inputDataRequestKey = null;
        },
      });
  }

  private clearInputDayState(): void {
    this.inputDayRequestId++;
    this.inputDataRequestKey = null;
    this.inputDayResponse = null;
    this.inputWeekResponse = null;
    this.inputMonthResponse = null;
    this.inputDayItemsBySlot = [];
    this.inputDayTimezone = DateTime.local().zoneName || 'UTC';
    this.loadingDayItems = false;
    this.dayItemsError = null;
  }

  private openActionsModal(
    dateLocal: string,
    occurredAt: string | null,
    sourceAssignment: CycleAssignment | null,
  ): void {
    if (!this.isDateLocal(dateLocal)) {
      return;
    }

    this.resetAssignmentModalState();
    this.activeModal = 'actions';
    this.clickedDateLocal = dateLocal;
    this.selectedModalDateLocal = dateLocal;
    this.selectedOccurredAt = occurredAt;
    this.selectedItemId = null;
    this.selectedActionAssignment = sourceAssignment;
  }

  private openAssignmentModal(
    dateLocal: string,
    sourceAssignment: CycleAssignment | null,
  ): void {
    if (!this.isDateLocal(dateLocal)) {
      return;
    }

    if (this.cycles.length === 0) {
      this.loadCycles();
    }
    this.activeModal = 'assignment';
    this.clickedDateLocal = dateLocal;
    this.selectedModalDateLocal = dateLocal;
    this.selectedOccurredAt = null;
    this.selectedItemId = null;
    this.editingAssignment = sourceAssignment;
    this.modalStartDateLocal = sourceAssignment?.startDateLocal ?? dateLocal;
    this.modalSelectedCycleId = sourceAssignment?.cycle.id ?? null;
    this.modalError = null;
    this.selectedActionAssignment = sourceAssignment;
  }

  private openExternalMealEntry(dateLocal: string, occurredAt: string | null): void {
    if (!this.isDateLocal(dateLocal)) {
      return;
    }

    this.externalMealEntryDialog
      .openCreate({
        apiBaseUrl: this.baseUrl,
        dateLocal,
        occurredAt,
        timezone: this.resolveTimezone(),
        slots: this.resolveExternalEntrySlots(dateLocal),
      })
      .subscribe((result) => {
        if (result) {
          this.reloadInputDataForCurrentView(true);
        }
      });
  }

  private openItemsModal(
    dateLocal: string,
    occurredAt: string | null,
    itemId: number | null,
  ): void {
    if (!this.isDateLocal(dateLocal)) {
      return;
    }

    this.resetAssignmentModalState();
    this.activeModal = 'items';
    this.clickedDateLocal = dateLocal;
    this.selectedModalDateLocal = dateLocal;
    this.selectedOccurredAt = occurredAt;
    this.selectedItemId = itemId;
  }

  private resolveExternalEntrySlots(dateLocal: string) {
    const response = this.findInputDayResponseForDate(dateLocal);
    const responseSlots = response?.slots ?? response?.daySet?.slots ?? [];
    if (responseSlots.length > 0) {
      return responseSlots;
    }

    return this.slots.map((slot) => ({
      slotId: slot.id,
      slotKey: slot.key,
      title: slot.title,
      sortOrder: slot.sortOrder,
      startTime: slot.startTime ?? null,
      endTime: slot.endTime ?? null,
      nutritionValue: null,
    }));
  }

  private findInputDayResponseForDate(dateLocal: string): InputDayResponse | null {
    if (this.inputDayResponse?.dateLocal === dateLocal) {
      return this.inputDayResponse;
    }

    return (
      this.inputWeekResponse?.days.find((day) => day.dateLocal === dateLocal) ??
      this.inputMonthResponse?.days.find((day) => day.dateLocal === dateLocal) ??
      null
    );
  }

  private isDateLocal(value: string): boolean {
    return value.length === 10 && DateTime.fromISO(value).isValid;
  }

  private onMutationSuccess(response: unknown): void {
    this.setLastResponse(response);
    this.setLastError(null);
    this.savingAssignment = false;
    this.resetModalState();
    this.reloadAssignmentsForCurrentRange(true);
    this.reloadInputDataForCurrentView(true);
  }

  private onMutationError(error: unknown): void {
    this.setLastError(error);
    this.modalError = error;
    this.savingAssignment = false;
  }

  private resolveTimezone(): string {
    return DateTime.local().zoneName || 'UTC';
  }

  private shouldThrottleAutomaticRefresh(): boolean {
    const now = Date.now();
    if (now - this.lastAutomaticRefreshAt < AUTO_REFRESH_THROTTLE_MS) {
      return true;
    }

    this.lastAutomaticRefreshAt = now;
    return false;
  }

  private shouldUseRecentData(lastLoadedAt: number): boolean {
    return (
      lastLoadedAt > 0 && Date.now() - lastLoadedAt < PLANNING_DATA_CACHE_MS
    );
  }

  private shouldSkipInputDataRequest(
    requestKey: string,
    force: boolean,
  ): boolean {
    if (this.inputDataRequestKey === requestKey) {
      return true;
    }

    return (
      !force &&
      this.lastInputDataLoadedKey === requestKey &&
      this.shouldUseRecentData(this.lastInputDataLoadedAt)
    );
  }

  private markInputDataLoaded(requestKey: string): void {
    this.lastInputDataLoadedKey = requestKey;
    this.lastInputDataLoadedAt = Date.now();
  }

  private invalidatePlanningDataCache(): void {
    this.lastCyclesLoadedAt = 0;
    this.lastSlotsLoadedAt = 0;
    this.lastAssignmentsLoadedAt = 0;
    this.lastAssignmentsLoadedKey = null;
    this.lastInputDataLoadedAt = 0;
    this.lastInputDataLoadedKey = null;
  }

  private resetAssignmentModalState(): void {
    this.editingAssignment = null;
    this.selectedActionAssignment = null;
    this.modalStartDateLocal = '';
    this.modalSelectedCycleId = null;
    this.modalError = null;
  }

  private resetModalState(): void {
    this.activeModal = null;
    this.clickedDateLocal = '';
    this.selectedModalDateLocal = '';
    this.selectedOccurredAt = null;
    this.selectedItemId = null;
    this.resetAssignmentModalState();
  }

  private setLastResponse(value: unknown): void {
    this.lastResponse = value;
    this.lastResponseText = this.stringifyDebugValue(value);
  }

  private setLastError(value: unknown): void {
    this.lastError = value;
    this.lastErrorText = value === null ? '' : this.stringifyDebugValue(value);
  }

  private stringifyDebugValue(value: unknown): string {
    if (value === null) {
      return 'null';
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private syncCalendarHeaderState(): void {
    const calendarRef = this.calendarRef();
    if (calendarRef?.currentView) {
      this.currentCalendarView = calendarRef.currentView;
    }

    if (calendarRef?.currentViewLabel) {
      this.calendarHeaderLabel = calendarRef.currentViewLabel;
    }
  }

  private applyRouteCalendarState(): void {
    const calendarRef = this.calendarRef();
    if (!calendarRef) {
      return;
    }

    const requestedView = this.requestedCalendarView;
    const requestedDateLocal = this.requestedCalendarDateLocal;
    const currentDateLocal = calendarRef.currentDate?.toISODate() ?? null;

    if (
      calendarRef.currentView === requestedView &&
      currentDateLocal === requestedDateLocal
    ) {
      return;
    }

    if (requestedView === 'day') {
      calendarRef.activateDayView(requestedDateLocal);
      this.syncCalendarHeaderState();
      return;
    }

    if (calendarRef.currentView !== requestedView) {
      calendarRef.switchView(requestedView);
      this.syncCalendarHeaderState();
    }
  }

  private updateRequestedCalendarState(queryParamMap: ParamMap): void {
    this.requestedCalendarView = this.resolveCalendarView(queryParamMap);
    this.requestedCalendarDateLocal = this.resolveCalendarDateLocal(queryParamMap);
  }

  private resolveInitialCalendarView(): CalendarView {
    return this.resolveCalendarView(this.route.snapshot.queryParamMap);
  }

  private resolveInitialCalendarDateLocal(): string {
    return this.resolveCalendarDateLocal(this.route.snapshot.queryParamMap);
  }

  private resolveCalendarView(queryParamMap: ParamMap): CalendarView {
    const requestedView = queryParamMap.get('view');
    return this.isCalendarView(requestedView) ? requestedView : 'month';
  }

  private resolveCalendarDateLocal(queryParamMap: ParamMap): string {
    const requestedDateLocal = queryParamMap.get('date') ?? '';
    if (this.isDateLocal(requestedDateLocal)) {
      return requestedDateLocal;
    }

    return DateTime.local().toFormat('yyyy-LL-dd');
  }

  private isCalendarView(value: string | null): value is CalendarView {
    return (
      value === 'day' ||
      value === 'week' ||
      value === 'month' ||
      value === 'year'
    );
  }

  private getFallbackCalendarViewLabel(view: CalendarView): string {
    if (view === 'year') {
      return 'Année';
    }

    if (view === 'month') {
      return 'Mois';
    }

    if (view === 'week') {
      return 'Semaine';
    }

    return 'Jour';
  }
}
