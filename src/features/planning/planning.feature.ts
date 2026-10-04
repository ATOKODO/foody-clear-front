import { UiStatusBadge } from '../../app/ui/status-badge/status-badge';
import { UiButton } from '../../app/ui/button/button';
import { TranslatePipe } from '../../app/i18n/translate-pipe';
import { UiModal } from '../../app/ui/modal/modal';
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
import { LatestRequest } from '../../utils/latest-request';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, ParamMap } from '@angular/router';
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
import { SegmentedToggle } from '../../app/ui/segmented-toggle/segmented-toggle';
import {
  PLANNING_CALENDAR_VIEW_OPTIONS,
  type PlanningActiveModal,
  type PlanningCalendarController,
  type PlanningInputDataKind,
  type PlanningInputDataRequest,
} from './planning.models';
import {
  getPlanningFallbackCalendarViewLabel,
  isPlanningDateLocal,
  resolvePlanningCalendarDateLocal,
  resolvePlanningCalendarView,
  resolvePlanningExternalEntrySlots,
  resolvePlanningHourClickDateLocal,
  resolvePlanningTimezone,
  shouldSkipPlanningInputDataRequest,
  shouldThrottlePlanningAutoRefresh,
  shouldUseRecentPlanningData,
  stringifyPlanningDebugValue,
} from './planning.helpers';

@Component({
  selector: 'app-planning',
  imports: [UiStatusBadge, UiButton, TranslatePipe, UiModal,
    FormsModule,
    Calendar,
    InputDayFeature,
    ListCycle,
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
  inputDayTimezone = resolvePlanningTimezone();
  readonly calendarViewOptions = PLANNING_CALENDAR_VIEW_OPTIONS;
  readonly initialCalendarDateLocal = resolvePlanningCalendarDateLocal(
    this.route.snapshot.queryParamMap,
  );
  readonly initialCalendarView = resolvePlanningCalendarView(
    this.route.snapshot.queryParamMap,
  );
  get calendarHeaderLabel(): string {
    return this.calendarRef()?.currentViewLabel ?? 'Chargement...';
  }

  currentCalendarView: CalendarView = this.initialCalendarView;
  currentAnchorDateLocal: string | null = null;
  currentRangeFromLocal: string | null = null;
  currentRangeToLocal: string | null = null;

  private readonly activeModalState = signal<PlanningActiveModal>(null);
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
  private readonly assignmentsRequest = new LatestRequest(inject(DestroyRef));
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

  get activeModal(): PlanningActiveModal {
    return this.activeModalState();
  }

  set activeModal(value: PlanningActiveModal) {
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

  switchCalendarView(view: CalendarView | null): void {
    if (!view) {
      return;
    }

    this.calendarRef()?.switchView(view);
    this.syncCalendarHeaderState();
  }

  getCalendarViewLabel(view: CalendarView): string {
    return (
      this.calendarRef()?.getViewLabel(view) ??
      getPlanningFallbackCalendarViewLabel(view)
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
    const dateLocal = resolvePlanningHourClickDateLocal(
      event.dateLocal,
      event.currentDateIso,
    );

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
      .convertTemplateItem(event.dateLocal, event.templateItemId, event.inventoryIds ?? [event.inventoryId])
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
      isPlanningDateLocal(this.modalStartDateLocal) &&
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
    this.openExternalEntryFromActions();
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
    if (!force) {
      const throttle = shouldThrottlePlanningAutoRefresh(
        this.lastAutomaticRefreshAt,
      );
      this.lastAutomaticRefreshAt = throttle.lastAutomaticRefreshAt;
      if (throttle.throttled) {
        return;
      }
    }

    if (options.includeCycles ?? true) {
      this.loadCycles(force);
    }
    this.loadSlots(force);
    this.reloadAssignmentsForCurrentRange(force);
    this.reloadInputDataForCurrentView(force);
  }

  private loadSlots(force = false): void {
    if (!force && shouldUseRecentPlanningData(this.lastSlotsLoadedAt)) {
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
    if (!force && shouldUseRecentPlanningData(this.lastCyclesLoadedAt)) {
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
    if (!isPlanningDateLocal(fromDateLocal) || !isPlanningDateLocal(toDateLocal)) {
      return;
    }

    const requestKey = `${fromDateLocal}:${toDateLocal}`;
    if (this.assignmentsRequestKey === requestKey) {
      return;
    }

    this.assignmentsRequest.cancel();
    this.assignmentsRequestKey = null;
    this.loadingAssignments = false;

    if (
      !force &&
      this.lastAssignmentsLoadedKey === requestKey &&
      shouldUseRecentPlanningData(this.lastAssignmentsLoadedAt)
    ) {
      return;
    }

    this.loadingAssignments = true;
    this.assignmentsRequestKey = requestKey;

    this.assignmentsRequest.subscribe(
      this.cycleAssignmentService.findInRange(fromDateLocal, toDateLocal), {
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

    if (globalThis.window === undefined) {
      load();
      return;
    }

    const idleWindow = globalThis.window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
    };

    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(load, { timeout: 1500 });
      return;
    }

    globalThis.window.setTimeout(load, 250);
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
    const request = this.prepareInputDataRequest('day', dateLocal, force);
    if (!request) {
      return;
    }

    this.inputDayService
      .getInputDay(dateLocal, request.timezone)
      .subscribe({
        next: (response) => {
          if (this.isStaleInputDataRequest(request.requestId)) {
            return;
          }

          this.inputDayResponse = response;
          this.inputDayTimezone =
            response.timezone?.trim() || request.timezone;
          this.inputDayItemsBySlot = response.itemsBySlot ?? [];
          this.completeInputDataRequest(request.requestKey);
        },
        error: (error) => {
          if (this.isStaleInputDataRequest(request.requestId)) {
            return;
          }

          this.failInputDataRequest(error);
        },
      });
  }

  private loadInputMonth(dateLocal: string, force = false): void {
    const request = this.prepareInputDataRequest('month', dateLocal, force);
    if (!request) {
      return;
    }

    this.inputDayService
      .getInputMonth(dateLocal, request.timezone)
      .subscribe({
        next: (response) => {
          if (this.isStaleInputDataRequest(request.requestId)) {
            return;
          }

          this.inputMonthResponse = response;
          this.inputDayTimezone =
            response.timezone?.trim() || request.timezone;
          this.completeInputDataRequest(request.requestKey);
        },
        error: (error) => {
          if (this.isStaleInputDataRequest(request.requestId)) {
            return;
          }

          this.failInputDataRequest(error);
        },
      });
  }

  private loadInputWeek(startDateLocal: string, force = false): void {
    const request = this.prepareInputDataRequest(
      'week',
      startDateLocal,
      force,
    );
    if (!request) {
      return;
    }

    this.inputDayService
      .getInputWeek(startDateLocal, request.timezone)
      .subscribe({
        next: (response) => {
          if (this.isStaleInputDataRequest(request.requestId)) {
            return;
          }

          this.inputWeekResponse = response;
          this.inputDayTimezone =
            response.timezone?.trim() || request.timezone;
          this.completeInputDataRequest(request.requestKey);
        },
        error: (error) => {
          if (this.isStaleInputDataRequest(request.requestId)) {
            return;
          }

          this.failInputDataRequest(error);
        },
      });
  }

  private prepareInputDataRequest(
    kind: PlanningInputDataKind,
    dateLocal: string,
    force: boolean,
  ): PlanningInputDataRequest | null {
    if (!isPlanningDateLocal(dateLocal)) {
      this.clearInputDayState();
      return null;
    }

    const timezone = resolvePlanningTimezone();
    const requestKey = `${kind}:${dateLocal}:${timezone}`;
    if (shouldSkipPlanningInputDataRequest({
      requestKey,
      force,
      inputDataRequestKey: this.inputDataRequestKey,
      lastInputDataLoadedKey: this.lastInputDataLoadedKey,
      lastInputDataLoadedAt: this.lastInputDataLoadedAt,
    })) {
      return null;
    }

    const requestId = ++this.inputDayRequestId;
    this.loadingDayItems = true;
    this.inputDataRequestKey = requestKey;
    this.dayItemsError = null;
    this.inputDayResponse = null;
    this.inputMonthResponse = null;
    this.inputWeekResponse = null;
    this.inputDayItemsBySlot = [];

    return { requestId, requestKey, timezone };
  }

  private isStaleInputDataRequest(requestId: number): boolean {
    return requestId !== this.inputDayRequestId;
  }

  private completeInputDataRequest(requestKey: string): void {
    this.markInputDataLoaded(requestKey);
    this.loadingDayItems = false;
    this.inputDataRequestKey = null;
  }

  private failInputDataRequest(error: unknown): void {
    this.inputDayItemsBySlot = [];
    this.dayItemsError = error;
    this.loadingDayItems = false;
    this.inputDataRequestKey = null;
  }

  private clearInputDayState(): void {
    this.inputDayRequestId++;
    this.inputDataRequestKey = null;
    this.inputDayResponse = null;
    this.inputWeekResponse = null;
    this.inputMonthResponse = null;
    this.inputDayItemsBySlot = [];
    this.inputDayTimezone = resolvePlanningTimezone();
    this.loadingDayItems = false;
    this.dayItemsError = null;
  }

  private openActionsModal(
    dateLocal: string,
    occurredAt: string | null,
    sourceAssignment: CycleAssignment | null,
  ): void {
    if (!isPlanningDateLocal(dateLocal)) {
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
    if (!isPlanningDateLocal(dateLocal)) {
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
    if (!isPlanningDateLocal(dateLocal)) {
      return;
    }

    this.externalMealEntryDialog
      .openCreate({
        apiBaseUrl: this.baseUrl,
        dateLocal,
        occurredAt,
        timezone: resolvePlanningTimezone(),
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
    if (!isPlanningDateLocal(dateLocal)) {
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
    return resolvePlanningExternalEntrySlots({
      dateLocal,
      slots: this.slots,
      inputDayResponse: this.inputDayResponse,
      inputWeekResponse: this.inputWeekResponse,
      inputMonthResponse: this.inputMonthResponse,
    });
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

  private markInputDataLoaded(requestKey: string): void {
    this.lastInputDataLoadedKey = requestKey;
    this.lastInputDataLoadedAt = Date.now();
  }

  private invalidatePlanningDataCache(): void {
    this.assignmentsRequest.cancel();
    this.assignmentsRequestKey = null;
    this.loadingAssignments = false;
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
    this.lastResponseText = stringifyPlanningDebugValue(value);
  }

  private setLastError(value: unknown): void {
    this.lastError = value;
    this.lastErrorText = value === null ? '' : stringifyPlanningDebugValue(value);
  }

  private syncCalendarHeaderState(): void {
    const calendarRef = this.calendarRef();
    if (calendarRef?.currentView) {
      this.currentCalendarView = calendarRef.currentView;
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
    this.requestedCalendarView = resolvePlanningCalendarView(queryParamMap);
    this.requestedCalendarDateLocal = resolvePlanningCalendarDateLocal(
      queryParamMap,
    );
  }
}
