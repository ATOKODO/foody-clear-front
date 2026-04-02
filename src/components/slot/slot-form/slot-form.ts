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
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CycleNutritionValue, NutritionReference } from '../../../interfaces/cycle.interface';
import { NutritionKeyMeta } from '../../../services/meta-service';
import {
  getFallbackUnitsForNutritionKey,
  resolveDefaultNutritionKeys,
} from '../../shared/default-nutrition-values';

export type SlotFormMode = 'add' | 'edit';

export interface SlotFormValue {
  key: string;
  title: string;
  sortOrder: number;
  startTime: string | null;
  endTime: string | null;
  nutritionValues: CycleNutritionValue[];
}

@Component({
  selector: 'app-slot-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './slot-form.html',
  styleUrl: './slot-form.scss',
})
export class SlotForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: SlotFormMode = 'add';
  @Input() slot: Partial<SlotFormValue> | null = null;
  @Input() showHeading = true;
  @Input() nutritionKeys: NutritionKeyMeta[] = [];

  @Output() readonly submitted = new EventEmitter<{
    mode: SlotFormMode;
    value: SlotFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();

  nutritionValues: CycleNutritionValue[] = [];
  readonly referenceOptions: Array<{ label: string; value: NutritionReference }> = [
    { label: 'Pour 100 g', value: 'PER_100G' },
    { label: 'Pour 100 ml', value: 'PER_100ML' },
  ];

  readonly form = this.fb.nonNullable.group({
    key: ['', [Validators.required]],
    title: ['', [Validators.required]],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    startTime: [''],
    endTime: [''],
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['slot'] || changes['nutritionKeys']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit' ? 'Modifier Slot' : 'Ajouter Slot';
  }

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const nutritionValues = this.nutritionValues
      .map((value) => this.normalizeNutritionValue(value))
      .filter((value) => value.nutritionKey !== '');

    this.submitted.emit({
      mode: this.mode,
      value: {
        key: rawValue.key,
        title: rawValue.title,
        sortOrder: rawValue.sortOrder,
        startTime: this.normalizeTime(rawValue.startTime),
        endTime: this.normalizeTime(rawValue.endTime),
        nutritionValues,
      },
    });
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
    const defaults: SlotFormValue = {
      key: '',
      title: '',
      sortOrder: 0,
      startTime: null,
      endTime: null,
      nutritionValues: this.getDefaultNutritionValues(),
    };

    if (this.mode === 'edit' && this.slot) {
      this.form.reset({
        key: this.slot.key ?? defaults.key,
        title: this.slot.title ?? defaults.title,
        sortOrder: this.slot.sortOrder ?? defaults.sortOrder,
        startTime: this.toInputTime(this.slot.startTime),
        endTime: this.toInputTime(this.slot.endTime),
      });
      this.nutritionValues =
        this.slot.nutritionValues && this.slot.nutritionValues.length > 0
          ? this.cloneNutritionValues(this.slot.nutritionValues)
          : this.getDefaultNutritionValues();
      return;
    }

    this.form.reset({
      key: defaults.key,
      title: defaults.title,
      sortOrder: defaults.sortOrder,
      startTime: this.toInputTime(defaults.startTime),
      endTime: this.toInputTime(defaults.endTime),
    });
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

  private normalizeTime(value: string): string | null {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private toInputTime(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value.length >= 5 ? value.slice(0, 5) : value;
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
}
