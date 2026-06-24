import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  viewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DateTime } from 'luxon';
import {
  Calendar,
  CalendarDayClickEvent,
  CalendarHourClickEvent,
  CalendarItemClickEvent,
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
import {
  InputDayItemsBySlotEntry,
  InputMonthResponse,
  InputDayResponse,
  InputWeekResponse,
} from '../../interfaces/input-day.interface';
import { CycleAssignementService } from '../../services/cycle-assignement-service';
import { CycleService } from '../../services/cycle-service';
import { InputDayService } from '../../services/input-day-service';
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
  | 'openDayView'
  | 'getViewLabel'
>;

const PLANNING_CALENDAR_VIEW_OPTIONS: readonly SegmentedToggleOption<CalendarView>[] =
  [
    { value: 'day', label: 'Jour', testId: 'planning-view-day' },
    { value: 'week', label: 'Semaine', testId: 'planning-view-week' },
    { value: 'month', label: 'Mois', testId: 'planning-view-month' },
    { value: 'year', label: 'Annee', testId: 'planning-view-year' },
  ];

@Component({
  selector: 'app-planning',
  imports: [
    FormsModule,
    Calendar,
    InputDayFeature,
    ListCycle,
    MatButtonModule,
    MatCardModule,
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
  private readonly cycleService = inject(CycleService);
  private readonly cycleAssignmentService = inject(CycleAssignementService);
  private readonly inputDayService = inject(InputDayService);

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
  inputDayTimezone = DateTime.local().zoneName || 'UTC';
  readonly calendarViewOptions = PLANNING_CALENDAR_VIEW_OPTIONS;
  calendarHeaderLabel = 'Chargement...';

  currentCalendarView: CalendarView = 'month';
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
    this.refreshPlanningData();
  }

  ngAfterViewInit(): void {
    this.syncCalendarHeaderState();
    this.changeDetectorRef.detectChanges();
  }

  onBaseUrlChange(): void {
    this.cycleService.setBaseUrl(this.baseUrl);
    this.cycleAssignmentService.setBaseUrl(this.baseUrl);
    this.inputDayService.setBaseUrl(this.baseUrl);
    this.refreshPlanningData();
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
    this.currentCalendarView = event.view;
    this.currentAnchorDateLocal = event.anchorDateLocal;
    this.currentRangeFromLocal = event.fromDateLocal;
    this.currentRangeToLocal = event.toDateLocal;
    this.syncCalendarHeaderState();
    this.loadAssignmentsInRange(event.fromDateLocal, event.toDateLocal);
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
    this.calendarRef()?.openDayView(event.dateLocal);
    this.syncCalendarHeaderState();
  }

  onCalendarItemClick(event: CalendarItemClickEvent): void {
    this.openItemsModal(event.dateLocal, null, event.item.id);
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

  onEmbeddedItemsChanged(_: { dateLocal: string }): void {
    this.reloadInputDataForCurrentView();
  }

  refreshPlanningData(): void {
    this.loadCycles();
    this.reloadAssignmentsForCurrentRange();
    this.reloadInputDataForCurrentView();
  }

  private loadCycles(): void {
    this.loadingCycles = true;

    this.cycleService.findAll().subscribe({
      next: (response) => {
        this.cycles = response;
        this.loadingCycles = false;
        this.setLastError(null);
      },
      error: (error) => {
        this.setLastError(error);
        this.loadingCycles = false;
      },
    });
  }

  private loadAssignmentsInRange(
    fromDateLocal: string,
    toDateLocal: string,
  ): void {
    if (!this.isDateLocal(fromDateLocal) || !this.isDateLocal(toDateLocal)) {
      return;
    }

    this.loadingAssignments = true;

    this.cycleAssignmentService
      .findInRange(fromDateLocal, toDateLocal)
      .subscribe({
        next: (response) => {
          this.cycleAssignments = response;
          this.setLastResponse(response);
          this.setLastError(null);
          this.loadingAssignments = false;
        },
        error: (error) => {
          this.setLastError(error);
          this.loadingAssignments = false;
        },
      });
  }

  private reloadAssignmentsForCurrentRange(): void {
    if (!this.currentRangeFromLocal || !this.currentRangeToLocal) {
      return;
    }

    this.loadAssignmentsInRange(
      this.currentRangeFromLocal,
      this.currentRangeToLocal,
    );
  }

  private reloadInputDataForCurrentView(): void {
    if (!this.currentAnchorDateLocal) {
      return;
    }

    if (this.currentCalendarView === 'day') {
      this.loadInputDay(this.currentAnchorDateLocal);
      return;
    }

    if (this.currentCalendarView === 'month' && this.currentRangeFromLocal) {
      this.loadInputMonth(this.currentRangeFromLocal);
      return;
    }

    if (this.currentCalendarView === 'week' && this.currentRangeFromLocal) {
      this.loadInputWeek(this.currentRangeFromLocal);
      return;
    }

    this.clearInputDayState();
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

  private loadInputDay(dateLocal: string): void {
    if (!this.isDateLocal(dateLocal)) {
      this.clearInputDayState();
      return;
    }

    const requestId = ++this.inputDayRequestId;
    this.loadingDayItems = true;
    this.dayItemsError = null;
    this.inputDayResponse = null;
    this.inputMonthResponse = null;
    this.inputWeekResponse = null;
    this.inputDayItemsBySlot = [];

    this.inputDayService
      .getInputDay(dateLocal, this.resolveTimezone())
      .subscribe({
        next: (response) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }
          this.inputDayResponse = response;
          this.inputDayTimezone =
            response.timezone?.trim() || this.resolveTimezone();
          this.inputDayItemsBySlot = response.itemsBySlot ?? [];
          this.loadingDayItems = false;
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
        },
      });
  }

  private loadInputMonth(dateLocal: string): void {
    if (!this.isDateLocal(dateLocal)) {
      this.clearInputDayState();
      return;
    }

    const requestId = ++this.inputDayRequestId;
    this.loadingDayItems = true;
    this.dayItemsError = null;
    this.inputDayResponse = null;
    this.inputMonthResponse = null;
    this.inputWeekResponse = null;
    this.inputDayItemsBySlot = [];

    this.inputDayService
      .getInputMonth(dateLocal, this.resolveTimezone())
      .subscribe({
        next: (response) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }

          this.inputMonthResponse = response;
          this.inputDayTimezone =
            response.timezone?.trim() || this.resolveTimezone();
          this.loadingDayItems = false;
        },
        error: (error) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }

          this.inputMonthResponse = null;
          this.inputDayItemsBySlot = [];
          this.dayItemsError = error;
          this.loadingDayItems = false;
        },
      });
  }

  private loadInputWeek(startDateLocal: string): void {
    if (!this.isDateLocal(startDateLocal)) {
      this.clearInputDayState();
      return;
    }

    const requestId = ++this.inputDayRequestId;
    this.loadingDayItems = true;
    this.dayItemsError = null;
    this.inputMonthResponse = null;
    this.inputDayResponse = null;
    this.inputWeekResponse = null;
    this.inputDayItemsBySlot = [];

    this.inputDayService
      .getInputWeek(startDateLocal, this.resolveTimezone())
      .subscribe({
        next: (response) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }

          this.inputWeekResponse = response;
          this.inputDayTimezone =
            response.timezone?.trim() || this.resolveTimezone();
          this.loadingDayItems = false;
        },
        error: (error) => {
          if (requestId !== this.inputDayRequestId) {
            return;
          }

          this.inputWeekResponse = null;
          this.inputDayItemsBySlot = [];
          this.dayItemsError = error;
          this.loadingDayItems = false;
        },
      });
  }

  private clearInputDayState(): void {
    this.inputDayRequestId++;
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

  private isDateLocal(value: string): boolean {
    return value.length === 10 && DateTime.fromISO(value).isValid;
  }

  private onMutationSuccess(response: unknown): void {
    this.setLastResponse(response);
    this.setLastError(null);
    this.savingAssignment = false;
    this.resetModalState();
    this.reloadAssignmentsForCurrentRange();
    this.reloadInputDataForCurrentView();
  }

  private onMutationError(error: unknown): void {
    this.setLastError(error);
    this.modalError = error;
    this.savingAssignment = false;
  }

  private resolveTimezone(): string {
    return DateTime.local().zoneName || 'UTC';
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

  private getFallbackCalendarViewLabel(view: CalendarView): string {
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
}
