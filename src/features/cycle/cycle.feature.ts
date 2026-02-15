import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  CycleFormValue,
  CycleFormMode,
  FormCycle,
} from '../../components/cycle/form-cycle/form-cycle';
import { DaySetListItem } from '../../components/day-set/day-set-list/day-set-list';
import {
  CycleListItem,
  ListCycle,
} from '../../components/cycle/list-cycle/list-cycle';
import { CycleService } from '../../services/cycle-service';
import {
  CreateCycleDto,
  Cycle,
  CycleNutritionValue,
} from '../../interfaces/cycle.interface';
import { DaySet } from '../../interfaces/day-set.interface';
import { DaySetService } from '../../services/day-set-service';
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';

type MacroTotals = {
  proteins: number;
  carbs: number;
  lipids: number;
};

@Component({
  selector: 'app-cycle',
  imports: [
    CommonModule,
    FormsModule,
    ListCycle,
    FormCycle,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './cycle.feature.html',
  styleUrl: './cycle.feature.scss',
})
export class CycleFeature implements OnInit {
  baseUrl = '';
  loading = false;
  saving = false;
  loadingMeta = false;

  cycles: Cycle[] = [];
  daySets: DaySet[] = [];
  selectedCycleId: number | null = null;

  formVisible = false;
  formMode: CycleFormMode = 'add';
  editingCycleId: number | null = null;

  formInitialValue: Partial<CycleFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;
  lastMetaError: unknown = null;

  nutritionKeys: NutritionKeyMeta[] = [];
  private macroNutritionKeys = {
    proteins: 'PROTEIN',
    carbs: 'CARBOHYDRATE',
    lipids: 'FAT',
  };

  constructor(
    private cycleSrv: CycleService,
    private daySetSrv: DaySetService,
    private metaSrv: MetaService,
  ) {}

  ngOnInit(): void {
    this.baseUrl = this.cycleSrv.baseUrl;
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadCycles();
  }

  onBaseUrlChange() {
    this.cycleSrv.setBaseUrl(this.baseUrl);
    this.metaSrv.setBaseUrl(this.baseUrl);
    this.daySetSrv.setBaseUrl(this.baseUrl);
    this.loadNutritionKeys();
    this.loadDaySets();
    this.loadCycles();
  }

  get cycleListItems(): CycleListItem[] {
    return this.cycles.map((cycle) => ({
      ...this.getCycleMacroTotals(cycle),
      id: cycle.id,
      title: cycle.title,
      color: cycle.color,
      durationCount: cycle.durationCount,
      durationType: cycle.durationType,
    }));
  }

  get daySetListItems(): DaySetListItem[] {
    return this.daySets.map((daySet) => ({
      id: String(daySet.id),
      title: daySet.title,
      nutritionValues: daySet.nutritionValues ?? [],
    }));
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingCycleId = null;
    this.formVisible = true;
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
      daySetIds: this.resolveCycleDaySetIds(cycle),
    };
    this.formVisible = true;
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
          this.formVisible = false;
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
        this.formVisible = false;
        this.loadCycles();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onCancelForm(): void {
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

  private getCycleMacroTotals(cycle: Cycle): MacroTotals {
    const values = cycle.nutritionValues ?? [];
    if (values.length > 0) {
      return this.extractMacroTotals(values);
    }

    return {
      proteins: this.toNumber((cycle as Partial<Cycle>).proteins),
      carbs: this.toNumber((cycle as Partial<Cycle>).carbs),
      lipids: this.toNumber((cycle as Partial<Cycle>).lipids),
    };
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

    const macros = this.getCycleMacroTotals(cycle);
    return this.buildNutritionValues(macros.proteins, macros.carbs, macros.lipids);
  }

  private extractMacroTotals(values: CycleNutritionValue[]): MacroTotals {
    const totals: MacroTotals = { proteins: 0, carbs: 0, lipids: 0 };

    values.forEach((value) => {
      const amount = this.toGrams(value.amount, value.unit);
      const key = value.nutritionKey.toUpperCase();

      if (key === this.macroNutritionKeys.proteins || key === 'PROTEIN') {
        totals.proteins += amount;
      } else if (key === this.macroNutritionKeys.carbs || key === 'CARBOHYDRATE') {
        totals.carbs += amount;
      } else if (key === this.macroNutritionKeys.lipids || key === 'FAT') {
        totals.lipids += amount;
      }
    });

    return {
      proteins: this.roundNumber(totals.proteins),
      carbs: this.roundNumber(totals.carbs),
      lipids: this.roundNumber(totals.lipids),
    };
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
      durationCount: value.nombre,
      durationType: value.typeDuree,
      daySetIds: this.normalizeDaySetIds(value.daySetIds),
    };
  }

  private resolveCycleDaySetIds(cycle: Cycle): number[] {
    if (Array.isArray(cycle.daySetOrder) && cycle.daySetOrder.length > 0) {
      return this.normalizeDaySetIds(cycle.daySetOrder);
    }

    const daySetIds = (cycle.daySets ?? [])
      .map((daySet) => {
        if (typeof daySet !== 'object' || daySet === null || !('id' in daySet)) {
          return NaN;
        }
        return Number((daySet as { id: unknown }).id);
      })
      .filter((id): id is number => Number.isFinite(id));

    return this.normalizeDaySetIds(daySetIds);
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

  private toGrams(amount: number, unit: string): number {
    const normalizedUnit = unit.toUpperCase();

    if (normalizedUnit === 'G') {
      return amount;
    }

    if (normalizedUnit === 'MG') {
      return amount / 1000;
    }

    return 0;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    return 0;
  }

  private roundNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private normalizeDaySetIds(daySetIds: number[] | null | undefined): number[] {
    return Array.from(new Set((daySetIds ?? []).filter((id) => Number.isInteger(id) && id > 0)));
  }
}
