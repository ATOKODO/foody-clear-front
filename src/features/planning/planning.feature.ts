import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  CalendarMonthClickEvent,
  CalendarViewChangeEvent,
} from '../../components/calendar/calendar';
import {
  CycleListItem,
  ListCycle,
} from '../../components/cycle/list-cycle/list-cycle';
import { CycleAssignment } from '../../interfaces/cycle-assignment.interface';
import { Cycle } from '../../interfaces/cycle.interface';
import { CalendarView } from '../../interfaces/calendar.interface';
import { InputDayItemsBySlotEntry } from '../../interfaces/input-day.interface';
import { CycleAssignementService } from '../../services/cycle-assignement-service';
import { CycleService } from '../../services/cycle-service';
import { InputDayService } from '../../services/input-day-service';

@Component({
  selector: 'app-planning',
  imports: [
    CommonModule,
    FormsModule,
    Calendar,
    ListCycle,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './planning.feature.html',
  styleUrl: './planning.feature.scss',
})
export class PlanningFeature implements OnInit {
  baseUrl = '';

  loadingCycles = false;
  loadingAssignments = false;
  loadingDayItems = false;
  savingAssignment = false;

  cycles: Cycle[] = [];
  cycleAssignments: CycleAssignment[] = [];
  inputDayItemsBySlot: InputDayItemsBySlotEntry[] = [];

  currentCalendarView: CalendarView = 'month';
  currentAnchorDateLocal: string | null = null;
  currentRangeFromLocal: string | null = null;
  currentRangeToLocal: string | null = null;

  isAssignmentModalOpen = false;
  clickedDateLocal = '';
  modalStartDateLocal = '';
  modalSelectedCycleId: number | null = null;
  editingAssignment: CycleAssignment | null = null;

  modalError: unknown = null;
  dayItemsError: unknown = null;
  lastResponse: unknown = null;
  lastError: unknown = null;
  private inputDayRequestId = 0;

  constructor(
    private readonly cycleService: CycleService,
    private readonly cycleAssignmentService: CycleAssignementService,
    private readonly inputDayService: InputDayService,
  ) {}

  ngOnInit(): void {
    this.baseUrl = this.cycleAssignmentService.baseUrl;
    this.inputDayService.setBaseUrl(this.baseUrl);
    this.loadCycles();
  }

  onBaseUrlChange(): void {
    this.cycleService.setBaseUrl(this.baseUrl);
    this.cycleAssignmentService.setBaseUrl(this.baseUrl);
    this.inputDayService.setBaseUrl(this.baseUrl);
    this.loadCycles();
    this.reloadAssignmentsForCurrentRange();
    this.reloadInputDayForCurrentView();
  }

  onCalendarViewChanged(event: CalendarViewChangeEvent): void {
    this.currentCalendarView = event.view;
    this.currentAnchorDateLocal = event.anchorDateLocal;
    this.currentRangeFromLocal = event.fromDateLocal;
    this.currentRangeToLocal = event.toDateLocal;
    this.loadAssignmentsInRange(event.fromDateLocal, event.toDateLocal);
    this.loadInputDayForView(event);
  }

  onCalendarDayClick(event: CalendarDayClickEvent): void {
    this.openAssignmentModal(event.day.date, event.sourceAssignment);
  }

  onCalendarHourClick(event: CalendarHourClickEvent): void {
    const dateLocal =
      event.dateLocal.trim() !== ''
        ? event.dateLocal
        : (DateTime.fromISO(event.currentDateIso).toISODate() ?? '');

    this.openAssignmentModal(dateLocal, event.sourceAssignment);
  }

  onCalendarMonthClick(event: CalendarMonthClickEvent): void {
    const dateLocal = DateTime.local(event.month.year, event.month.month, 1).toISODate() ?? '';
    const sourceAssignment =
      event.sourceAssignments.length === 1 ? event.sourceAssignments[0] : null;

    this.openAssignmentModal(dateLocal, sourceAssignment);
  }

  onModalCycleSelected(item: CycleListItem): void {
    this.modalSelectedCycleId = item.id;
  }

  get cycleListItems(): CycleListItem[] {
    return this.cycles.map((cycle) => ({
      id: cycle.id,
      title: cycle.title,
      color: cycle.color,
      proteins: this.toNumber(cycle.proteins),
      carbs: this.toNumber(cycle.carbs),
      lipids: this.toNumber(cycle.lipids),
      durationCount: cycle.durationCount,
      durationType: cycle.durationType,
    }));
  }

  get modalSelectedIds(): number[] {
    return this.modalSelectedCycleId === null ? [] : [this.modalSelectedCycleId];
  }

  get canSubmitModal(): boolean {
    return (
      this.modalSelectedCycleId !== null &&
      this.isDateLocal(this.modalStartDateLocal) &&
      this.cycles.some((cycle) => cycle.id === this.modalSelectedCycleId)
    );
  }

  closeAssignmentModal(): void {
    if (this.savingAssignment) {
      return;
    }

    this.isAssignmentModalOpen = false;
    this.editingAssignment = null;
    this.modalError = null;
  }

  saveAssignmentFromModal(): void {
    if (!this.canSubmitModal || this.modalSelectedCycleId === null) {
      return;
    }

    const selectedCycle = this.cycles.find((cycle) => cycle.id === this.modalSelectedCycleId);
    if (!selectedCycle) {
      return;
    }

    const payload = {
      cycleId: selectedCycle.id,
      startDateLocal: this.modalStartDateLocal,
      endDateLocal: this.computeEndDateLocal(this.modalStartDateLocal, selectedCycle),
    };

    this.savingAssignment = true;
    this.modalError = null;

    if (this.editingAssignment) {
      this.cycleAssignmentService.update(this.editingAssignment.id, payload).subscribe({
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
        this.onMutationSuccess({ removed: true, id: this.editingAssignment?.id });
      },
      error: (error) => {
        this.onMutationError(error);
      },
    });
  }

  private loadCycles(): void {
    this.loadingCycles = true;

    this.cycleService.findAll().subscribe({
      next: (response) => {
        this.cycles = response;
        this.loadingCycles = false;
        this.lastError = null;
      },
      error: (error) => {
        this.lastError = error;
        this.loadingCycles = false;
      },
    });
  }

  private loadAssignmentsInRange(fromDateLocal: string, toDateLocal: string): void {
    if (!this.isDateLocal(fromDateLocal) || !this.isDateLocal(toDateLocal)) {
      return;
    }

    this.loadingAssignments = true;

    this.cycleAssignmentService.findInRange(fromDateLocal, toDateLocal).subscribe({
      next: (response) => {
        this.cycleAssignments = response;
        this.lastResponse = response;
        this.lastError = null;
        this.loadingAssignments = false;
      },
      error: (error) => {
        this.lastError = error;
        this.loadingAssignments = false;
      },
    });
  }

  private reloadAssignmentsForCurrentRange(): void {
    if (!this.currentRangeFromLocal || !this.currentRangeToLocal) {
      return;
    }

    this.loadAssignmentsInRange(this.currentRangeFromLocal, this.currentRangeToLocal);
  }

  private reloadInputDayForCurrentView(): void {
    if (this.currentCalendarView !== 'day' || !this.currentAnchorDateLocal) {
      return;
    }

    this.loadInputDay(this.currentAnchorDateLocal);
  }

  private loadInputDayForView(event: CalendarViewChangeEvent): void {
    if (event.view !== 'day') {
      this.clearInputDayState();
      return;
    }

    this.loadInputDay(event.anchorDateLocal);
  }

  private loadInputDay(dateLocal: string): void {
    if (!this.isDateLocal(dateLocal)) {
      this.clearInputDayState();
      return;
    }

    const requestId = ++this.inputDayRequestId;
    this.loadingDayItems = true;
    this.dayItemsError = null;
    this.inputDayItemsBySlot = [];

    this.inputDayService.getInputDay(dateLocal, this.resolveTimezone()).subscribe({
      next: (response) => {
        if (requestId !== this.inputDayRequestId) {
          return;
        }
        this.inputDayItemsBySlot = response.itemsBySlot ?? [];
        this.loadingDayItems = false;
      },
      error: (error) => {
        if (requestId !== this.inputDayRequestId) {
          return;
        }
        this.inputDayItemsBySlot = [];
        this.dayItemsError = error;
        this.loadingDayItems = false;
      },
    });
  }

  private clearInputDayState(): void {
    this.inputDayRequestId++;
    this.inputDayItemsBySlot = [];
    this.loadingDayItems = false;
    this.dayItemsError = null;
  }

  private openAssignmentModal(
    dateLocal: string,
    sourceAssignment: CycleAssignment | null,
  ): void {
    if (!this.isDateLocal(dateLocal)) {
      return;
    }

    this.clickedDateLocal = dateLocal;
    this.editingAssignment = sourceAssignment;
    this.modalStartDateLocal = sourceAssignment?.startDateLocal ?? dateLocal;
    this.modalSelectedCycleId = sourceAssignment?.cycle.id ?? null;
    this.modalError = null;
    this.isAssignmentModalOpen = true;
  }

  private computeEndDateLocal(startDateLocal: string, cycle: Cycle): string {
    const startDate = DateTime.fromISO(startDateLocal).startOf('day');
    if (!startDate.isValid) {
      return startDateLocal;
    }

    const durationCount = Math.max(1, Math.trunc(cycle.durationCount));

    let endDateExclusive = startDate.plus({ days: durationCount });
    if (cycle.durationType === 'semaine') {
      endDateExclusive = startDate.plus({ weeks: durationCount });
    } else if (cycle.durationType === 'mois') {
      endDateExclusive = startDate.plus({ months: durationCount });
    }

    return endDateExclusive.minus({ days: 1 }).toISODate() ?? startDateLocal;
  }

  private isDateLocal(value: string): boolean {
    return value.length === 10 && DateTime.fromISO(value).isValid;
  }

  private onMutationSuccess(response: unknown): void {
    this.lastResponse = response;
    this.lastError = null;
    this.savingAssignment = false;
    this.isAssignmentModalOpen = false;
    this.editingAssignment = null;
    this.modalError = null;
    this.reloadAssignmentsForCurrentRange();
  }

  private onMutationError(error: unknown): void {
    this.lastError = error;
    this.modalError = error;
    this.savingAssignment = false;
  }

  private toNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private resolveTimezone(): string {
    return DateTime.local().zoneName || 'UTC';
  }
}
