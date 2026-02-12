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
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';

@Component({
  selector: 'app-day-set-feature',
  imports: [CommonModule, MatButtonModule, MatCardModule, DaySetList, DaySetForm],
  templateUrl: './day-set.feature.html',
  styleUrl: './day-set.feature.scss',
})
export class DaySetFeature implements OnInit {
  daySets: DaySetListItem[] = [
    {
      id: '1',
      title: 'Lundi',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 50, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'CARBOHYDRATE', amount: 120, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'FAT', amount: 30, unit: 'G', reference: 'PER_100G' },
      ],
    },
    {
      id: '2',
      title: 'Repos',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 50, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'CARBOHYDRATE', amount: 120, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'FAT', amount: 30, unit: 'G', reference: 'PER_100G' },
      ],
    },
    {
      id: '3',
      title: 'Mardi',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 50, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'CARBOHYDRATE', amount: 150, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'FAT', amount: 30, unit: 'G', reference: 'PER_100G' },
      ],
    },
  ];

  formVisible = false;
  formMode: DaySetFormMode = 'add';
  editingDaySetId: string | null = null;
  formInitialValue: Partial<DaySetFormValue> | null = null;

  lastResponse: unknown = null;
  loadingMeta = false;
  lastMetaError: unknown = null;
  nutritionKeys: NutritionKeyMeta[] = [];

  constructor(private metaSrv: MetaService) {}

  ngOnInit(): void {
    this.loadNutritionKeys();
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.editingDaySetId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  onEditRequested(item: DaySetListItem): void {
    const daySet = this.daySets.find((value) => value.id === item.id);
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
    this.daySets = this.daySets.filter((value) => value.id !== item.id);
    this.lastResponse = this.daySets;

    if (this.editingDaySetId === item.id) {
      this.onCancelForm();
    }
  }

  onFormSubmitted(event: { mode: DaySetFormMode; value: DaySetFormValue }): void {
    if (event.mode === 'edit' && this.editingDaySetId !== null) {
      this.daySets = this.daySets.map((item) =>
        item.id === this.editingDaySetId
          ? {
              ...item,
              title: event.value.title,
              nutritionValues: this.normalizeNutritionValues(event.value.nutritionValues),
            }
          : item,
      );
    } else {
      const newItem: DaySetListItem = {
        id: this.getNextId(),
        title: event.value.title,
        nutritionValues: this.normalizeNutritionValues(event.value.nutritionValues),
      };
      this.daySets = [...this.daySets, newItem];
    }

    this.lastResponse = this.daySets;
    this.onCancelForm();
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

  private getNextId(): string {
    const maxId = this.daySets.reduce((max, item) => {
      const numericId = Number(item.id);
      return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
    }, 0);

    return String(maxId + 1);
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

  private getEditableNutritionValues(daySet: DaySetListItem): CycleNutritionValue[] {
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
        amount: daySet.protein ?? 0,
        unit: 'G',
        reference: 'PER_100G',
      },
      {
        nutritionKey: 'CARBOHYDRATE',
        amount: daySet.carbs ?? 0,
        unit: 'G',
        reference: 'PER_100G',
      },
      {
        nutritionKey: 'FAT',
        amount: daySet.fat ?? 0,
        unit: 'G',
        reference: 'PER_100G',
      },
    ];
  }
}
