import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

@Component({
  selector: 'app-slot-feature',
  imports: [CommonModule, MatButtonModule, MatCardModule, SlotList, SlotForm],
  templateUrl: './slot.feature.html',
  styleUrl: './slot.feature.scss',
})
export class SlotFeature {
  slots: SlotListItem[] = [
    { id: '1', title: 'Petit dejeuner', protein: 50, carbs: 120, fat: 30 },
    { id: '2', title: 'Dejeuner', protein: 50, carbs: 120, fat: 30 },
    { id: '3', title: 'Diner', protein: 50, carbs: 150, fat: 30 },
  ];

  formVisible = false;
  formMode: SlotFormMode = 'add';
  editingSlotId: string | null = null;
  formInitialValue: Partial<SlotFormValue> | null = null;

  lastResponse: unknown = null;

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
              protein: event.value.protein,
              carbs: event.value.carbs,
              fat: event.value.fat,
            }
          : item,
      );
    } else {
      const newItem: SlotListItem = {
        id: this.getNextId(),
        title: event.value.title,
        protein: event.value.protein,
        carbs: event.value.carbs,
        fat: event.value.fat,
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
}
