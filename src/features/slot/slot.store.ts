import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  SlotFormMode,
  SlotFormValue,
} from '../../components/slot/slot-form/slot-form';
import type { SlotListItem } from '../../components/slot/slot-list/slot-list';
import type { Slot } from '../../interfaces/slot.interface';
import { MetaService, NutritionKeyMeta } from '../../services/meta-service';
import { SlotService } from '../../services/slot-service';
import {
  getSlotIdFromListItem,
  toCreateSlotDto,
  toEditableSlotFormValue,
  toSlotListItems,
} from './slot.viewmodel';

@Injectable()
export class SlotFeatureStore {
  private readonly slotSrv = inject(SlotService);
  private readonly metaSrv = inject(MetaService);

  private readonly slotsState = signal<Slot[]>([]);
  readonly slotListItems = computed<SlotListItem[]>(() =>
    toSlotListItems(this.slots),
  );
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly loadingMetaState = signal(false);

  readonly formVisible = signal(false);
  formMode: SlotFormMode = 'add';
  editingSlotId: number | null = null;
  formInitialValue: Partial<SlotFormValue> | null = null;

  lastResponse: unknown = null;
  lastError: unknown = null;
  lastMetaError: unknown = null;
  nutritionKeys: NutritionKeyMeta[] = [];

  refresh(): void {
    this.loadNutritionKeys();
    this.loadSlots();
  }

  get slots(): Slot[] {
    return this.slotsState();
  }

  set slots(value: Slot[]) {
    this.slotsState.set(value);
  }

  get loading(): boolean {
    return this.loadingState();
  }

  set loading(value: boolean) {
    this.loadingState.set(value);
  }

  get saving(): boolean {
    return this.savingState();
  }

  set saving(value: boolean) {
    this.savingState.set(value);
  }

  get loadingMeta(): boolean {
    return this.loadingMetaState();
  }

  set loadingMeta(value: boolean) {
    this.loadingMetaState.set(value);
  }

  onAddRequested(): boolean {
    this.formMode = 'add';
    this.editingSlotId = null;
    this.formInitialValue = null;
    this.openForm();
    return true;
  }

  openCreate(): boolean {
    return this.onAddRequested();
  }

  onEditRequested(item: SlotListItem): boolean {
    const slotId = getSlotIdFromListItem(item);
    if (slotId === null) {
      return false;
    }

    const slot = this.slots.find((value) => value.id === slotId);
    if (!slot) {
      return false;
    }

    this.formMode = 'edit';
    this.editingSlotId = slot.id;
    this.formInitialValue = toEditableSlotFormValue(slot);
    this.openForm();
    return true;
  }

  onDeleteRequested(
    item: SlotListItem,
    onDataChanged: () => void,
  ): void {
    const slotId = getSlotIdFromListItem(item);
    if (slotId === null) {
      return;
    }

    this.saving = true;
    this.slotSrv.remove(slotId).subscribe({
      next: () => {
        this.lastResponse = { deleted: true, id: slotId };
        this.lastError = null;
        this.saving = false;
        onDataChanged();

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

  onFormSubmitted(
    event: { mode: SlotFormMode; value: SlotFormValue },
    onDataChanged: () => void,
  ): void {
    const payload = toCreateSlotDto(event.value);
    this.saving = true;

    const request =
      event.mode === 'edit' && this.editingSlotId !== null
        ? this.slotSrv.update(this.editingSlotId, payload)
        : this.slotSrv.create(payload);

    request.subscribe({
      next: (response) => {
        this.lastResponse = response;
        this.lastError = null;
        this.saving = false;
        this.closeForm();
        onDataChanged();
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
    this.closeForm();
  }

  private openForm(): void {
    this.formVisible.set(true);
  }

  private closeForm(): void {
    this.formVisible.set(false);
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
}
