import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { DaySet } from '../../../interfaces/day-set.interface';
import {
  InputDayMacroValue,
  InputDayTargetSource,
  InputDayTotalsMacrosBySlotEntry,
} from '../../../interfaces/input-day.interface';
import { Slot } from '../../../interfaces/slot.interface';
import { Template, TemplateItem } from '../../../interfaces/template.interface';
import { UiErrorPanel } from '../../../app/ui/error-panel/error-panel';

@Component({
  selector: 'app-template-list',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSelectModule,
    UiErrorPanel,
  ],
  templateUrl: './template-list.html',
  styleUrl: './template-list.scss',
})
export class TemplateList {
  @Input() templates: Template[] = [];
  @Input() selectedTemplateId: number | null = null;
  @Input() selectedTemplate: Template | null = null;
  @Input() compareDaySetId: number | null = null;
  @Input() daySets: DaySet[] = [];
  @Input() slots: Slot[] = [];
  @Input() loadingTemplates = false;
  @Input() loadingProducts = false;
  @Input() loadingDaySets = false;
  @Input() loadingSlots = false;
  @Input() savingTemplate = false;
  @Input() savingItem = false;
  @Input() lastError: unknown = null;

  @Output() readonly addRequested = new EventEmitter<void>();
  @Output() readonly editRequested = new EventEmitter<void>();
  @Output() readonly templateSelected = new EventEmitter<number>();
  @Output() readonly compareDaySetChanged = new EventEmitter<number | null>();

  get sortedTemplates(): Template[] {
    return [...this.templates].sort((left, right) =>
      left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
    );
  }

  get sortedDaySets(): DaySet[] {
    return [...this.daySets].sort((left, right) =>
      left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
    );
  }

  get busy(): boolean {
    return (
      this.loadingTemplates ||
      this.loadingProducts ||
      this.loadingDaySets ||
      this.loadingSlots ||
      this.savingTemplate ||
      this.savingItem
    );
  }

  onAddClick(): void {
    this.addRequested.emit();
  }

  onEditClick(): void {
    this.editRequested.emit();
  }

  onTemplateClick(templateId: number): void {
    this.templateSelected.emit(templateId);
  }

  onCompareDaySetChange(value: number | null): void {
    this.compareDaySetChanged.emit(value);
  }

  getTargetSourceText(targetSource: InputDayTargetSource): string {
    if (targetSource === 'daySet') {
      return 'Comparaison avec un day set';
    }

    if (targetSource === 'cycle') {
      return 'Comparaison avec un cycle';
    }

    return 'Aucune cible';
  }

  getSlotMacroEntries(
    value: InputDayTotalsMacrosBySlotEntry,
  ): Array<{ key: string; value: InputDayMacroValue }> {
    return Object.entries(value)
      .filter(
        ([key]) =>
          !['slot', 'targets', 'deltaToTargets', 'incompleteNutritionKeys'].includes(key),
      )
      .map(([key, entry]) => ({ key, value: entry as InputDayMacroValue }));
  }

  formatMacroValue(value: InputDayMacroValue): string {
    if (typeof value !== 'number') {
      return value;
    }

    return this.formatNumber(value);
  }

  formatNutritionAmount(value: number): string {
    return this.formatNumber(value);
  }

  hasEntries(value: Record<string, unknown> | null | undefined): boolean {
    return !!value && Object.keys(value).length > 0;
  }

  resolveTemplateItemSlotLabel(item: TemplateItem): string {
    if (item.slotId !== null) {
      const slot = this.slots.find((candidate) => candidate.id === item.slotId) ?? null;
      if (slot) {
        return `${slot.sortOrder}. ${slot.title}`;
      }
    }

    return item.slotKey?.trim() || 'Sans slot';
  }

  private formatNumber(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
      maximumFractionDigits: 2,
    }).format(rounded);
  }
}
