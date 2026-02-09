import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

@Component({
  selector: 'app-day-set-feature',
  imports: [CommonModule, MatButtonModule, MatCardModule, DaySetList, DaySetForm],
  templateUrl: './day-set.feature.html',
  styleUrl: './day-set.feature.scss',
})
export class DaySetFeature {
  daySets: DaySetListItem[] = [
    { id: '1', title: 'Lundi', protein: 50, carbs: 120, fat: 30 },
    { id: '2', title: 'Repos', protein: 50, carbs: 120, fat: 30 },
    { id: '3', title: 'Mardi', protein: 50, carbs: 150, fat: 30 },
  ];

  formVisible = false;
  formMode: DaySetFormMode = 'add';
  editingDaySetId: string | null = null;
  formInitialValue: Partial<DaySetFormValue> | null = null;

  lastResponse: unknown = null;

  onAddRequested(): void {
    this.formMode = 'add';
    this.editingDaySetId = null;
    this.formInitialValue = null;
    this.formVisible = true;
  }

  onFormSubmitted(event: { mode: DaySetFormMode; value: DaySetFormValue }): void {
    if (event.mode === 'edit' && this.editingDaySetId !== null) {
      this.daySets = this.daySets.map((item) =>
        item.id === this.editingDaySetId
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
      const newItem: DaySetListItem = {
        id: this.getNextId(),
        title: event.value.title,
        protein: event.value.protein,
        carbs: event.value.carbs,
        fat: event.value.fat,
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
}
