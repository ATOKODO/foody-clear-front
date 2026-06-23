import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CycleNutritionValue, NutritionReference } from '../../../interfaces/cycle.interface';
import { NutritionKeyMeta } from '../../../services/meta-service';
import { SlotList, SlotListItem } from '../../slot/slot-list/slot-list';
import { TemplateSummary } from '../../../interfaces/template.interface';
import {
  getFallbackUnitsForNutritionKey,
  resolveDefaultNutritionKeys,
} from '../../shared/default-nutrition-values';

export type DaySetFormMode = 'add' | 'edit';

export interface DaySetFormValue {
  title: string;
  nutritionValues: CycleNutritionValue[];
  slotIds: number[];
  templateId: number | null;
}

@Component({
  selector: 'app-day-set-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SlotList,
  ],
  templateUrl: './day-set-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './day-set-form.scss',
})
export class DaySetForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: DaySetFormMode = 'add';
  @Input() daySet: Partial<DaySetFormValue> | null = null;
  @Input() showHeading = true;
  @Input() inDialog = false;
  @Input() nutritionKeys: NutritionKeyMeta[] = [];
  @Input() slots: SlotListItem[] = [];
  @Input() templates: TemplateSummary[] = [];

  @Output() readonly submitted = new EventEmitter<{
    mode: DaySetFormMode;
    value: DaySetFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();

  nutritionValues: CycleNutritionValue[] = [];
  selectedSlotIds: number[] = [];
  selectedTemplateId: number | null = null;
  readonly referenceOptions: Array<{ label: string; value: NutritionReference }> = [
    { label: 'Pour 100 g', value: 'PER_100G' },
    { label: 'Pour 100 ml', value: 'PER_100ML' },
  ];

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['daySet'] || changes['nutritionKeys']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit' ? 'Modifier DaySet' : 'Ajouter DaySet';
  }

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nutritionValues = this.nutritionValues
      .map((value) => this.normalizeNutritionValue(value))
      .filter((value) => value.nutritionKey !== '');

    this.submitted.emit({
      mode: this.mode,
      value: {
        ...this.form.getRawValue(),
        nutritionValues,
        slotIds: [...this.selectedSlotIds],
        templateId: this.selectedTemplateId,
      },
    });
  }

  onSlotsSelected(slots: SlotListItem[]): void {
    this.selectedSlotIds = this.normalizeSlotIds(
      slots
        .map((slot) => Number(slot.id))
        .filter((id) => Number.isFinite(id)),
    );
  }

  get selectedSlotIdsAsString(): string[] {
    return this.selectedSlotIds.map((id) => String(id));
  }

  addNutritionValue(): void {
    this.nutritionValues = [...this.nutritionValues, this.buildDefaultNutritionValue()];
  }

  removeNutritionValue(index: number): void {
    this.nutritionValues = this.nutritionValues.filter((_, i) => i !== index);
  }

  onNutritionKeyChange(index: number): void {
    const row = this.nutritionValues[index];
    if (!row) {
      return;
    }

    const allowedUnits = this.getAllowedUnits(row.nutritionKey);
    if (allowedUnits.length === 0) {
      row.unit = this.getFallbackUnits(row.nutritionKey)[0];
      return;
    }

    if (!allowedUnits.includes(row.unit)) {
      row.unit = allowedUnits[0];
    }
  }

  getUnitsForKey(nutritionKey: string): string[] {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    return allowedUnits.length > 0 ? allowedUnits : this.getFallbackUnits(nutritionKey);
  }

  private applyInputState(): void {
    const defaults: DaySetFormValue = {
      title: '',
      nutritionValues: this.getDefaultNutritionValues(),
      slotIds: [],
      templateId: null,
    };

    if (this.mode === 'edit' && this.daySet) {
      this.form.reset({
        title: this.daySet.title ?? defaults.title,
      });
      this.selectedSlotIds = this.normalizeSlotIds(this.daySet.slotIds ?? defaults.slotIds);
      this.selectedTemplateId = this.normalizeTemplateId(
        this.daySet.templateId ?? defaults.templateId,
      );
      this.nutritionValues =
        this.daySet.nutritionValues && this.daySet.nutritionValues.length > 0
          ? this.cloneNutritionValues(this.daySet.nutritionValues)
          : this.getDefaultNutritionValues();
      return;
    }

    this.form.reset({ title: defaults.title });
    this.selectedSlotIds = [...defaults.slotIds];
    this.selectedTemplateId = defaults.templateId;
    this.nutritionValues = this.cloneNutritionValues(defaults.nutritionValues);
  }

  private getDefaultNutritionValues(): CycleNutritionValue[] {
    const defaults = resolveDefaultNutritionKeys(this.nutritionKeys).map((key) =>
      this.buildDefaultNutritionValue(key),
    );
    return this.cloneNutritionValues(defaults);
  }

  private buildDefaultNutritionValue(nutritionKey = ''): CycleNutritionValue {
    const unit = this.pickDefaultUnit(nutritionKey);
    return {
      nutritionKey,
      amount: 0,
      unit,
      reference: 'PER_100G',
    };
  }

  private cloneNutritionValues(values: CycleNutritionValue[]): CycleNutritionValue[] {
    return values.map((value) => this.normalizeNutritionValue(value));
  }

  private normalizeNutritionValue(value: CycleNutritionValue): CycleNutritionValue {
    const nutritionKey = (value.nutritionKey ?? '').trim();
    const amount = Number.isFinite(value.amount) ? Math.max(0, value.amount) : 0;
    const unit = this.pickDefaultUnit(nutritionKey, value.unit);
    const reference = value.reference === 'PER_100ML' ? 'PER_100ML' : 'PER_100G';

    return {
      nutritionKey,
      amount,
      unit,
      reference,
    };
  }

  private pickDefaultUnit(nutritionKey: string, preferred?: string): string {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    if (allowedUnits.length === 0) {
      return preferred && preferred.trim() !== ''
        ? preferred
        : this.getFallbackUnits(nutritionKey)[0];
    }

    if (preferred && allowedUnits.includes(preferred)) {
      return preferred;
    }

    const gramUnit = allowedUnits.find((unit) => unit.toUpperCase() === 'G');
    return gramUnit ?? allowedUnits[0];
  }

  private getAllowedUnits(nutritionKey: string): string[] {
    if (nutritionKey.trim() === '') {
      return [];
    }

    const key = this.nutritionKeys.find(
      (item) =>
        item.value.toUpperCase() === nutritionKey.toUpperCase() ||
        item.key.toUpperCase() === nutritionKey.toUpperCase(),
    );

    if (!key) {
      return [];
    }

    return key.allowedUnits.filter((unit) => unit.trim() !== '');
  }

  private getFallbackUnits(nutritionKey: string): string[] {
    return getFallbackUnitsForNutritionKey(nutritionKey);
  }

  private normalizeSlotIds(slotIds: number[]): number[] {
    return Array.from(new Set(slotIds.filter((id) => Number.isInteger(id) && id > 0)));
  }

  private normalizeTemplateId(templateId: number | null | undefined): number | null {
    return typeof templateId === 'number' && Number.isInteger(templateId) && templateId > 0
      ? templateId
      : null;
  }
}
