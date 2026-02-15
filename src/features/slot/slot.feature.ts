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
import { CreateSlotDto, Slot } from '../../interfaces/slot.interface';
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';
import { SlotService } from '../../services/slot-service';

@Component({
  selector: 'app-slot-feature',
  imports: [CommonModule, MatButtonModule, MatCardModule, SlotList, SlotForm],
  templateUrl: './slot.feature.html',
  styleUrl: './slot.feature.scss',
})
export class SlotFeature implements OnInit {
  slots: Slot[] = [];
  loading = false;
  saving = false;

  formVisible = false;
  formMode: SlotFormMode = 'add';
  editingSlotId: number | null = null;
  formInitialValue: Partial<SlotFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;
  loadingMeta = false;
  lastMetaError: unknown = null;
  nutritionKeys: NutritionKeyMeta[] = [];

  constructor(
    private readonly slotSrv: SlotService,
    private readonly metaSrv: MetaService,
  ) {}

  ngOnInit(): void {
    this.loadNutritionKeys();
    this.loadSlots();
  }

  get slotListItems(): SlotListItem[] {
    return this.slots.map((slot) => ({
      id: String(slot.id),
      key: slot.key,
      title: slot.title,
      sortOrder: slot.sortOrder,
      startTime: slot.startTime ?? null,
      endTime: slot.endTime ?? null,
      nutritionValues: slot.nutritionValues ?? [],
    }));
  }

  onAddRequested(): void {
    this.formMode = 'add';
    this.editingSlotId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  onEditRequested(item: SlotListItem): void {
    const slotId = Number(item.id);
    if (!Number.isFinite(slotId)) {
      return;
    }

    const slot = this.slots.find((value) => value.id === slotId);
    if (!slot) {
      return;
    }

    this.formMode = 'edit';
    this.editingSlotId = slot.id;
    this.formInitialValue = {
      key: slot.key,
      title: slot.title,
      sortOrder: slot.sortOrder,
      startTime: slot.startTime ?? null,
      endTime: slot.endTime ?? null,
      nutritionValues: this.getEditableNutritionValues(slot),
    };
    this.formVisible = true;
  }

  onDeleteRequested(item: SlotListItem): void {
    const slotId = Number(item.id);
    if (!Number.isFinite(slotId)) {
      return;
    }

    this.saving = true;
    this.slotSrv.remove(slotId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: slotId };
        this.lastError = null;
        this.saving = false;

        if (this.editingSlotId === slotId) {
          this.onCancelForm();
        }

        this.loadSlots();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
  }

  onFormSubmitted(event: { mode: SlotFormMode; value: SlotFormValue }): void {
    const payload = this.toCreateDto(event.value);
    this.saving = true;

    if (event.mode === 'edit' && this.editingSlotId !== null) {
      this.slotSrv.update(this.editingSlotId, payload).subscribe({
        next: (response) => {
          this.lastResponse = response;
          this.lastError = null;
          this.saving = false;
          this.formVisible = false;
          this.loadSlots();
        },
        error: (error) => {
          this.lastError = error;
          this.saving = false;
        },
      });
      return;
    }

    this.slotSrv.create(payload).subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.formVisible = false;
        this.loadSlots();
      },
      error: (error) => {
        this.lastError = error;
        this.saving = false;
      },
    });
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

  private loadSlots(): void {
    this.loading = true;
    this.slotSrv.findAll().subscribe({
      next: (response) => {
        this.slots = response;
        this.lastResponse = response;
        this.lastError = null;
        this.loading = false;

        if (
          this.editingSlotId !== null &&
          !this.slots.some((slot) => slot.id === this.editingSlotId)
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

  private toCreateDto(value: SlotFormValue): CreateSlotDto {
    return {
      key: value.key.trim(),
      title: value.title,
      sortOrder: Number.isFinite(value.sortOrder) ? Math.max(0, value.sortOrder) : 0,
      startTime: this.normalizeTime(value.startTime),
      endTime: this.normalizeTime(value.endTime),
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

  private getEditableNutritionValues(slot: Slot): CycleNutritionValue[] {
    if (slot.nutritionValues && slot.nutritionValues.length > 0) {
      return slot.nutritionValues.map((value) => ({
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

  private normalizeTime(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}
