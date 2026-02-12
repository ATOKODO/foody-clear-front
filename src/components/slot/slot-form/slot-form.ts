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
import { CycleNutritionValue, NutritionReference } from '../../../interfaces/cycle.interface';
import { NutritionKeyMeta } from '../../../services/meta-service';

export type SlotFormMode = 'add' | 'edit';

export interface SlotFormValue {
  title: string;
  nutritionValues: CycleNutritionValue[];
}

@Component({
  selector: 'app-slot-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './slot-form.html',
  styleUrl: './slot-form.scss',
})
export class SlotForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: SlotFormMode = 'add';
  @Input() slot: Partial<SlotFormValue> | null = null;
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
    title: ['', [Validators.required]],
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

    const nutritionValues = this.nutritionValues
      .map((value) => this.normalizeNutritionValue(value))
      .filter((value) => value.nutritionKey !== '');

    this.submitted.emit({
      mode: this.mode,
      value: {
        ...this.form.getRawValue(),
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
      row.unit = 'G';
      return;
    }

    if (!allowedUnits.includes(row.unit)) {
      row.unit = allowedUnits[0];
    }
  }

  getUnitsForKey(nutritionKey: string): string[] {
    const allowedUnits = this.getAllowedUnits(nutritionKey);
    return allowedUnits.length > 0 ? allowedUnits : ['G', 'MG'];
  }

  private applyInputState(): void {
    const defaults: SlotFormValue = {
      title: '',
      nutritionValues: this.getDefaultNutritionValues(),
    };

    if (this.mode === 'edit' && this.slot) {
      this.form.reset({
        title: this.slot.title ?? defaults.title,
      });
      this.nutritionValues =
        this.slot.nutritionValues && this.slot.nutritionValues.length > 0
          ? this.cloneNutritionValues(this.slot.nutritionValues)
          : this.getDefaultNutritionValues();
      return;
    }

    this.form.reset({ title: defaults.title });
    this.nutritionValues = this.cloneNutritionValues(defaults.nutritionValues);
  }

  private getDefaultNutritionValues(): CycleNutritionValue[] {
    const defaults = ['PROTEIN', 'CARBOHYDRATE', 'FAT'].map((key) =>
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
      return preferred && preferred.trim() !== '' ? preferred : 'G';
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
}
