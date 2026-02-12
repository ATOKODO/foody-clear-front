import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  DaySetForm,
  DaySetFormMode,
  DaySetFormValue,
} from '../../components/day-set/day-set-form/day-set-form';
import {
  DaySetList,
  DaySetListItem,
} from '../../components/day-set/day-set-list/day-set-list';
import { CycleNutritionValue } from '../../interfaces/cycle.interface';
import { CreateDaySetDto, DaySet } from '../../interfaces/day-set.interface';
import { DaySetService } from '../../services/day-set-service';
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';

@Component({
  selector: 'app-day-set-feature',
  imports: [CommonModule, MatButtonModule, MatCardModule, DaySetList, DaySetForm],
  templateUrl: './day-set.feature.html',
  styleUrl: './day-set.feature.scss',
})
export class DaySetFeature implements OnInit {
  daySets: DaySet[] = [];
  loading = false;
  saving = false;

  formVisible = false;
  formMode: DaySetFormMode = 'add';
  editingDaySetId: number | null = null;
  formInitialValue: Partial<DaySetFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;
  loadingMeta = false;
  lastMetaError: unknown = null;
  nutritionKeys: NutritionKeyMeta[] = [];

  constructor(
    private readonly daySetSrv: DaySetService,
    private readonly metaSrv: MetaService,
  ) {}

  ngOnInit(): void {
    this.loadNutritionKeys();
    this.loadDaySets();
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
    this.editingDaySetId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  onEditRequested(item: DaySetListItem): void {
    const daySetId = Number(item.id);
    if (!Number.isFinite(daySetId)) {
      return;
    }

    const daySet = this.daySets.find((value) => value.id === daySetId);
    if (!daySet) {
      return;
    }

    this.formMode = 'edit';
    this.editingDaySetId = daySet.id;
    this.formInitialValue = {
      title: daySet.title,
      nutritionValues: this.getEditableNutritionValues(daySet),
    };
    this.formVisible = true;
  }

  onDeleteRequested(item: DaySetListItem): void {
    const daySetId = Number(item.id);
    if (!Number.isFinite(daySetId)) {
      return;
    }

    this.saving = true;
    this.daySetSrv.remove(daySetId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: daySetId };
        this.lastError = null;
        this.saving = false;

        if (this.editingDaySetId === daySetId) {
          this.onCancelForm();
        }

        this.loadDaySets();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: DaySetFormMode; value: DaySetFormValue }): void {
    const payload = this.toCreateDto(event.value);
    this.saving = true;

    if (event.mode === 'edit' && this.editingDaySetId !== null) {
      this.daySetSrv.update(this.editingDaySetId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.formVisible = false;
          this.loadDaySets();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    this.daySetSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.formVisible = false;
        this.loadDaySets();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onMenuClicked(): void {
    this.lastResponse = {
      info: 'Action menu day-set-form capturee.',
      at: new Date().toISOString(),
    };
  }

  onCancelForm(): void {
    this.formVisible = false;
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingDaySetId = null;
  }

  private loadNutritionKeys(): void {
    this.loadingMeta = true;
    this.metaSrv.getNutritionKeys().subscribe({
      next: (nutritionKeys) => {
        this.nutritionKeys = nutritionKeys;
        this.lastMetaError = null;
        this.loadingMeta = false;
      },
      error: (error) => {
        this.lastMetaError = error;
        this.loadingMeta = false;
      },
    });
  }

  private loadDaySets(): void {
    this.loading = true;
    this.daySetSrv.findAll().subscribe({
      next: (response) => {
        this.daySets = response;
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

        if (
          this.editingDaySetId !== null &&
          !this.daySets.some((daySet) => daySet.id === this.editingDaySetId)
        ) {
          this.onCancelForm();
        }
      },
      error: (error) => {
        this.lastError = error;
        this.loading = false;
      },
    });
  }

  private toCreateDto(value: DaySetFormValue): CreateDaySetDto {
    return {
      title: value.title,
      nutritionValues: this.normalizeNutritionValues(value.nutritionValues),
    };
  }

  private normalizeNutritionValues(values: CycleNutritionValue[]): CycleNutritionValue[] {
    return values
      .map((value) => ({
        nutritionKey: value.nutritionKey.trim().toUpperCase(),
        amount: Number.isFinite(value.amount) ? Math.max(0, value.amount) : 0,
        unit: value.unit,
        reference: value.reference,
      }))
      .filter((value) => value.nutritionKey !== '');
  }

  private getEditableNutritionValues(daySet: DaySet): CycleNutritionValue[] {
    if (daySet.nutritionValues && daySet.nutritionValues.length > 0) {
      return daySet.nutritionValues.map((value) => ({
        nutritionKey: value.nutritionKey,
        amount: value.amount,
        unit: value.unit,
        reference: value.reference,
      }));
    }

    return [
      {
        nutritionKey: 'PROTEIN',
        amount: 0,
        unit: 'G',
        reference: 'PER_100G',
      },
      {
        nutritionKey: 'CARBOHYDRATE',
        amount: 0,
        unit: 'G',
        reference: 'PER_100G',
      },
      {
        nutritionKey: 'FAT',
        amount: 0,
        unit: 'G',
        reference: 'PER_100G',
      },
    ];
  }
}
