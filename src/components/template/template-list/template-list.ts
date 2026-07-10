import { KeyValuePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MasterDetailLayout } from '../../shared/master-detail-layout/master-detail-layout';
import { DaySet } from '../../../interfaces/day-set.interface';
import {
  InputDayMacroValue,
  InputDayTargetSource,
  InputDayTotalsMacrosBySlotEntry,
} from '../../../interfaces/input-day.interface';
import { Slot } from '../../../interfaces/slot.interface';
import { Template, TemplateItem } from '../../../interfaces/template.interface';

@Component({
  selector: 'app-template-list',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MasterDetailLayout,
    KeyValuePipe
],
  templateUrl: './template-list.html',
  styleUrl: './template-list.scss',
})
export class TemplateList {
  readonly templates = input<Template[]>([]);
  readonly selectedTemplateId = input<number | null>(null);
  readonly selectedTemplate = input<Template | null>(null);
  readonly compareDaySetId = input<number | null>(null);
  readonly daySets = input<DaySet[]>([]);
  readonly slots = input<Slot[]>([]);
  readonly loadingTemplates = input(false);
  readonly loadingProducts = input(false);
  readonly loadingDaySets = input(false);
  readonly loadingSlots = input(false);
  readonly savingTemplate = input(false);
  readonly savingItem = input(false);

  readonly editRequested = output<number>();
  readonly deleteRequested = output<number>();
  readonly templateSelected = output<number>();
  readonly compareDaySetChanged = output<number | null>();

  get sortedTemplates(): Template[] {
    return [...this.templates()].sort((left, right) =>
      left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
    );
  }

  get sortedDaySets(): DaySet[] {
    return [...this.daySets()].sort((left, right) =>
      left.title.localeCompare(right.title, 'fr', { sensitivity: 'base' }),
    );
  }

  get busy(): boolean {
    return (
      this.loadingTemplates() ||
      this.loadingProducts() ||
      this.loadingDaySets() ||
      this.loadingSlots() ||
      this.savingTemplate() ||
      this.savingItem()
    );
  }

  onEditClick(templateId: number): void {
    this.editRequested.emit(templateId);
  }

  onDeleteClick(templateId: number): void {
    this.deleteRequested.emit(templateId);
  }

  onTemplateClick(templateId: number): void {
    this.templateSelected.emit(templateId);
  }

  onTemplateKeydown(event: KeyboardEvent, templateId: number): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.onTemplateClick(templateId);
  }

  onCompareDaySetChange(value: number | null): void {
    this.compareDaySetChanged.emit(value);
  }

  getTargetSourceText(targetSource: InputDayTargetSource): string {
    if (targetSource === 'daySet') {
      return 'Compared with a day set';
    }

    if (targetSource === 'cycle') {
      return 'Compared with a cycle';
    }

    return 'No target';
  }

  getSlotMacroEntries(
    value: InputDayTotalsMacrosBySlotEntry,
  ): { key: string; value: InputDayMacroValue }[] {
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

  formatNutritionAmount(value: number | null | undefined): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '-';
    }

    return this.formatNumber(value);
  }

  getStockAvailabilityLabel(item: TemplateItem): string {
    if (item.stockAvailability?.enoughStock === true) {
      return 'Stock OK';
    }

    if (item.stockAvailability?.enoughStock === false) {
      return 'Low stock';
    }

    return 'Unknown stock';
  }

  hasEntries(value: Record<string, unknown> | null | undefined): boolean {
    return !!value && Object.keys(value).length > 0;
  }


  resolveTemplateItemLabel(item: TemplateItem): string {
    return item.displayName ?? item.mealName ?? item.dishName ?? item.productName ?? 'Unnamed item';
  }

  resolveTemplateItemTypeLabel(item: TemplateItem): string {
    let itemType = item.itemType;
    if (itemType === null || itemType === undefined) {
      itemType = item.mealId != null ? 'meal' : item.dishId != null ? 'dish' : 'product';
    }
    if (itemType === 'meal') {
      return 'Meal';
    }
    if (itemType === 'dish') {
      return 'Dish';
    }
    return 'Product';
  }

  resolveTemplateItemSlotLabel(item: TemplateItem): string {
    if (item.slotId != null) {
      const slot = this.slots().find((candidate) => candidate.id === item.slotId) ?? null;
      if (slot) {
        return `${slot.sortOrder}. ${slot.title}`;
      }
    }

    return item.slotKey?.trim() || 'No slot';
  }

  private formatNumber(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
      maximumFractionDigits: 2,
    }).format(rounded);
  }
}
