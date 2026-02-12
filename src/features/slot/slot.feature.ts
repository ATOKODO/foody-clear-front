import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  SlotForm,
  SlotFormMode,
  SlotFormValue,
} from '../../components/slot/slot-form/slot-form';
import {
  SlotList,
  SlotListItem,
} from '../../components/slot/slot-list/slot-list';
import { CycleNutritionValue } from '../../interfaces/cycle.interface';
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';

@Component({
  selector: 'app-slot-feature',
  imports: [CommonModule, MatButtonModule, MatCardModule, SlotList, SlotForm],
  templateUrl: './slot.feature.html',
  styleUrl: './slot.feature.scss',
})
export class SlotFeature implements OnInit {
  slots: SlotListItem[] = [
    {
      id: '1',
      title: 'Petit dejeuner',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 50, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'CARBOHYDRATE', amount: 120, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'FAT', amount: 30, unit: 'G', reference: 'PER_100G' },
      ],
    },
    {
      id: '2',
      title: 'Dejeuner',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 50, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'CARBOHYDRATE', amount: 120, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'FAT', amount: 30, unit: 'G', reference: 'PER_100G' },
      ],
    },
    {
      id: '3',
      title: 'Diner',
      nutritionValues: [
        { nutritionKey: 'PROTEIN', amount: 50, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'CARBOHYDRATE', amount: 150, unit: 'G', reference: 'PER_100G' },
        { nutritionKey: 'FAT', amount: 30, unit: 'G', reference: 'PER_100G' },
      ],
    },
  ];

  formVisible = false;
  formMode: SlotFormMode = 'add';
  editingSlotId: string | null = null;
  formInitialValue: Partial<SlotFormValue> | null = null;

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
    this.editingSlotId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  onFormSubmitted(event: { mode: SlotFormMode; value: SlotFormValue }): void {
    if (event.mode === 'edit' && this.editingSlotId !== null) {
      this.slots = this.slots.map((item) =>
        item.id === this.editingSlotId
          ? {
              ...item,
              title: event.value.title,
              nutritionValues: this.normalizeNutritionValues(event.value.nutritionValues),
            }
          : item,
      );
    } else {
      const newItem: SlotListItem = {
        id: this.getNextId(),
        title: event.value.title,
        nutritionValues: this.normalizeNutritionValues(event.value.nutritionValues),
      };
      this.slots = [...this.slots, newItem];
    }

    this.lastResponse = this.slots;
    this.onCancelForm();
  }

  onMenuClicked(): void {
    this.lastResponse = {
      info: 'Action menu slot-form capturee.',
      at: new Date().toISOString(),
    };
  }

  onCancelForm(): void {
    this.formVisible = false;
    this.formMode = 'add';
    this.formInitialValue = null;
    this.editingSlotId = null;
  }

  private getNextId(): string {
    const maxId = this.slots.reduce((max, item) => {
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
}
