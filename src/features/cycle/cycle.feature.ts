import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  CycleFormMode,
  CycleFormValue,
  FormCycle,
} from '../../components/cycle/form-cycle/form-cycle';
import { CycleListItem, ListCycle } from '../../components/cycle/list-cycle/list-cycle';
import {
  buildCycleListItem,
  getCycleMacroTotals,
  resolveCycleDaySetIds,
  resolveCycleDurationDays,
} from '../../components/cycle/list-cycle/cycle-list-item.mapper';
import { DaySetListItem } from '../../components/day-set/day-set-list/day-set-list';
import {
  CreateCycleDto,
  Cycle,
  CycleNutritionValue,
} from '../../interfaces/cycle.interface';
import { DaySet } from '../../interfaces/day-set.interface';
import { Slot } from '../../interfaces/slot.interface';
import { CycleService } from '../../services/cycle-service';
import { DaySetService } from '../../services/day-set-service';
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';
import { SlotService } from '../../services/slot-service';
import { DaySetFeature } from '../day-set/day-set.feature';
import { SlotFeature } from '../slot/slot.feature';

type CycleHubView = 'cycle' | 'daySet' | 'slot';

@Component({
  selector: 'app-cycle',
  imports: [
    CommonModule,
    FormsModule,
    ListCycle,
    FormCycle,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    DaySetFeature,
    SlotFeature,
  ],
  templateUrl: './cycle.feature.html',
  styleUrl: './cycle.feature.scss',
})
export class CycleFeature implements OnInit {
  @ViewChild('cycleFormDialog')
  private cycleFormDialogTemplate?: TemplateRef<unknown>;

  private readonly dialog = inject(MatDialog);

  baseUrl = '';
  loading = false;
  saving = false;
  loadingMeta = false;

  cycles: Cycle[] = [];
  daySets: DaySet[] = [];
  slots: Slot[] = [];
  selectedCycleId: number | null = null;
  activeView: CycleHubView = 'cycle';

  formVisible = false;
  formMode: CycleFormMode = 'add';
  editingCycleId: number | null = null;

  formInitialValue: Partial<CycleFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;
  lastMetaError: unknown = null;

  nutritionKeys: NutritionKeyMeta[] = [];
  private dialogRef: MatDialogRef<unknown> | null = null;
  private macroNutritionKeys = {
    proteins: 'PROTEIN',
    carbs: 'CARBOHYDRATE',
    lipids: 'FAT',
  };

  constructor(
    private readonly cycleSrv: CycleService,
    private readonly daySetSrv: DaySetService,
    private readonly metaSrv: MetaService,
    private readonly slotSrv: SlotService,
  ) {}

  ngOnInit(): void {
    this.baseUrl = this.cycleSrv.baseUrl;
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadSlots();
    this.loadCycles();
  }

  onBaseUrlChange(): void {
    this.cycleSrv.setBaseUrl(this.baseUrl);
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.slotSrv.setBaseUrl(this.baseUrl);
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadSlots();
    this.loadCycles();
  }

  get cycleListItems(): CycleListItem[] {
    return this.cycles.map((cycle) =>
      buildCycleListItem(cycle, {
        macroNutritionKeys: this.macroNutritionKeys,
        fallbackDaySets: this.daySets,
        fallbackSlots: this.slots,
      }),
    );
  }

  get daySetListItems(): DaySetListItem[] {
    return this.daySets.map((daySet) => ({
      id: String(daySet.id),
      title: daySet.title,
      nutritionValues: daySet.nutritionValues ?? [],
    }));
  }

  get formDialogTitle(): string {
    return this.formMode === 'edit' ? 'Modifier un cycle' : 'Ajouter un cycle';
  }

  get formDialogSubtitle(): string {
    return this.formMode === 'edit'
      ? 'Les changements sont appliques sans quitter la liste.'
      : 'Creez un cycle sans descendre en bas de page.';
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingCycleId = null;
    this.openFormDialog();
  }

  onEditRequested(item: CycleListItem): void {
    const cycle = this.cycles.find((value) => value.id === item.id);
    if (!cycle) {
      return;
    }

    this.formMode = 'edit';
    this.editingCycleId = cycle.id;
    this.selectedCycleId = cycle.id;
    this.formInitialValue = {
      titre: cycle.title,
      couleur: cycle.color,
      nutritionValues: this.getEditableNutritionValues(cycle),
      nombre: cycle.durationCount,
      typeDuree: cycle.durationType,
      durationDays: resolveCycleDurationDays(cycle),
      daySetIds: resolveCycleDaySetIds(cycle),
      daySetOrder: resolveCycleDaySetIds(cycle),
    };
    this.openFormDialog();
  }

  onDeleteRequested(item: CycleListItem): void {
    this.saving = true;
    this.cycleSrv.remove(item.id).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: item.id };
        this.lastError = null;
        this.saving = false;

        if (this.editingCycleId === item.id) {
          this.onCancelForm();
        }

        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: CycleFormMode; value: CycleFormValue }): void {
    const payload = this.toCreateDto(event.value);
    this.saving = true;

    if (event.mode === 'edit' && this.editingCycleId !== null) {
      this.cycleSrv.update(this.editingCycleId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.closeFormDialog('submitted');
          this.loadCycles();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    this.cycleSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.closeFormDialog('submitted');
        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onCancelForm(): void {
    this.closeFormDialog('cancelled');
  }

  onLinkedDataChanged(): void {
    this.loadDaySets();
    this.loadSlots();
    this.loadCycles();
  }

  private openFormDialog(): void {
    if (!this.cycleFormDialogTemplate || this.dialogRef !== null) {
      this.formVisible = this.dialogRef !== null;
      return;
    }

    this.formVisible = true;
    this.dialogRef = this.dialog.open(this.cycleFormDialogTemplate, {
      width: '1100px',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null;
      this.resetFormState();
    });
  }

  private closeFormDialog(result: 'submitted' | 'cancelled'): void {
    if (this.dialogRef !== null) {
      this.dialogRef.close(result);
      return;
    }

    this.resetFormState();
  }

  private resetFormState(): void {
    this.formVisible = false;
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingCycleId = null;
  }

  private loadCycles(): void {
    this.loading = true;
    this.cycleSrv.findAll().subscribe({
      next: (response) => {
        this.cycles = response;
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

        if (
          this.selectedCycleId !== null &&
          !this.cycles.some((cycle) => cycle.id === this.selectedCycleId)
        ) {
          this.selectedCycleId = null;
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  private loadDaySets(): void {
    this.daySetSrv.findAll().subscribe({
      next: (response) => {
        this.daySets = response;
      },
      error: () => {
        this.daySets = [];
      },
    });
  }

  private loadSlots(): void {
    this.slotSrv.findAll().subscribe({
      next: (response) => {
        this.slots = response;
      },
      error: () => {
        this.slots = [];
      },
    });
  }

  private loadNutritionKeys(): void {
    this.loadingMeta = true;
    this.metaSrv.getNutritionKeys().subscribe({
      next: (nutritionKeys) => {
        this.nutritionKeys = nutritionKeys;
        this.macroNutritionKeys = {
          proteins: this.resolveNutritionKey(nutritionKeys, 'PROTEIN'),
          carbs: this.resolveNutritionKey(nutritionKeys, 'CARBOHYDRATE'),
          lipids: this.resolveNutritionKey(nutritionKeys, 'FAT'),
        };
        this.lastMetaError = null;
        this.loadingMeta = false;
      },
      error: (error) => {
        this.lastMetaError = error;
        this.loadingMeta = false;
      },
    });
  }

  private getEditableNutritionValues(cycle: Cycle): CycleNutritionValue[] {
    if (cycle.nutritionValues && cycle.nutritionValues.length > 0) {
      return cycle.nutritionValues.map((value) => ({
        nutritionKey: value.nutritionKey,
        amount: this.toNumber(value.amount),
        unit: value.unit,
        reference: value.reference,
      }));
    }

    const macros = getCycleMacroTotals(cycle, this.macroNutritionKeys);
    return this.buildNutritionValues(macros.proteins, macros.carbs, macros.lipids);
  }

  private toCreateDto(value: CycleFormValue): CreateCycleDto {
    const nutritionValues = value.nutritionValues
      .map((nutritionValue) =>
        this.buildNutritionValue(
          nutritionValue.nutritionKey,
          nutritionValue.amount,
          nutritionValue.unit,
          nutritionValue.reference,
        ),
      )
      .filter((nutritionValue) => nutritionValue.nutritionKey.trim() !== '');

    return {
      title: value.titre,
      color: value.couleur,
      nutritionValues,
      durationDays: this.normalizePositiveInteger(value.durationDays, 1),
      durationCount: value.nombre,
      durationType: value.typeDuree,
      daySetIds: this.normalizeDaySetIds(value.daySetOrder),
      daySetOrder: this.normalizeDaySetIds(value.daySetOrder),
    };
  }

  private buildNutritionValues(
    proteins: number,
    carbs: number,
    lipids: number,
  ): CycleNutritionValue[] {
    return [
      this.buildNutritionValue(this.macroNutritionKeys.proteins, proteins),
      this.buildNutritionValue(this.macroNutritionKeys.carbs, carbs),
      this.buildNutritionValue(this.macroNutritionKeys.lipids, lipids),
    ];
  }

  private buildNutritionValue(
    nutritionKey: string,
    amount: number,
    unit?: string,
    reference?: 'PER_100G' | 'PER_100ML',
  ): CycleNutritionValue {
    const resolvedNutritionKey = this.normalizeNutritionKey(nutritionKey);
    return {
      nutritionKey: resolvedNutritionKey,
      amount: this.roundNumber(amount),
      unit: unit ?? this.resolveUnitForNutritionKey(resolvedNutritionKey),
      reference: reference ?? 'PER_100G',
    };
  }

  private normalizeNutritionKey(nutritionKey: string): string {
    const normalized = nutritionKey.trim();
    if (normalized === '') {
      return '';
    }

    const found = this.nutritionKeys.find(
      (key) =>
        key.value.toUpperCase() === normalized.toUpperCase() ||
        key.key.toUpperCase() === normalized.toUpperCase(),
    );
    return found?.value ?? normalized.toUpperCase();
  }

  private resolveNutritionKey(
    nutritionKeys: NutritionKeyMeta[],
    expectedKey: 'PROTEIN' | 'CARBOHYDRATE' | 'FAT',
  ): string {
    const found = nutritionKeys.find(
      (key) =>
        key.value.toUpperCase() === expectedKey ||
        key.key.toUpperCase() === expectedKey,
    );
    return found?.value ?? expectedKey;
  }

  private resolveUnitForNutritionKey(nutritionKey: string): string {
    const found = this.nutritionKeys.find(
      (key) =>
        key.value.toUpperCase() === nutritionKey.toUpperCase() ||
        key.key.toUpperCase() === nutritionKey.toUpperCase(),
    );
    if (!found || found.allowedUnits.length === 0) {
      return 'G';
    }

    const gramUnit = found.allowedUnits.find((unit) => unit.toUpperCase() === 'G');
    return gramUnit ?? found.allowedUnits[0];
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private normalizeDaySetIds(daySetIds: number[] | null | undefined): number[] {
    return Array.from(new Set((daySetIds ?? []).filter((id) => Number.isInteger(id) && id > 0)));
  }

  private normalizePositiveInteger(value: unknown, fallback: number): number {
    const normalized = Math.trunc(Number(value));
    return normalized >= 1 ? normalized : fallback;
  }
}
