import { UiButton } from '../../../app/ui/button/button';
import { TranslatePipe } from '../../../app/i18n/translate-pipe';

import {
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  input,
  output
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CycleNutritionValue, NutritionReference } from '../../../interfaces/cycle.interface';
import { NutritionKeyMeta } from '../../../services/meta-service';
import {
  NutritionValueEditor,
} from '../../shared/nutrition-value-editor';

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
  imports: [UiButton,
    TranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './slot-form.html',
  host: { style: 'display: block' },
})
export class SlotForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly saving = input(false);
  readonly mode = input<SlotFormMode>('add');
  readonly slot = input<Partial<SlotFormValue> | null>(null);
  readonly showHeading = input(true);
  readonly nutritionKeys = input<NutritionKeyMeta[]>([]);

  readonly submitted = output<{
    mode: SlotFormMode;
    value: SlotFormValue;
}>();
  readonly menuClicked = output<void>();

  nutritionValues: CycleNutritionValue[] = [];
  private readonly nutritionValueEditor = new NutritionValueEditor(() => this.nutritionKeys());
  readonly referenceOptions: { label: string; value: NutritionReference }[] = [
    { label: 'Per 100 g', value: 'PER_100G' },
    { label: 'Per 100 ml', value: 'PER_100ML' },
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
    return this.mode() === 'edit' ? 'Edit slot' : 'Add slot';
  }

  onMenuClick(): void {
    this.menuClicked.emit();
  }

  onSubmit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const nutritionValues = this.nutritionValueEditor.normalizeValuesForSubmission(
      this.nutritionValues,
    );

    this.submitted.emit({
      mode: this.mode(),
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
    this.nutritionValues = [...this.nutritionValues, this.nutritionValueEditor.createDefaultValue()];
  }

  removeNutritionValue(index: number): void {
    this.nutritionValues = this.nutritionValues.filter((_, i) => i !== index);
  }

  onNutritionKeyChange(index: number): void {
    const row = this.nutritionValues[index];
    if (!row) {
      return;
    }

    this.nutritionValueEditor.ensureUnit(row);
  }

  getUnitsForKey(nutritionKey: string): string[] {
    return this.nutritionValueEditor.getUnitsForKey(nutritionKey);
  }

  private applyInputState(): void {
    const defaults: SlotFormValue = {
      key: '',
      title: '',
      sortOrder: 0,
      startTime: null,
      endTime: null,
      nutritionValues: this.nutritionValueEditor.createDefaultValues(),
    };

    const slot = this.slot();
    if (this.mode() === 'edit' && slot) {
      this.form.reset({
        key: slot.key ?? defaults.key,
        title: slot.title ?? defaults.title,
        sortOrder: slot.sortOrder ?? defaults.sortOrder,
        startTime: this.toInputTime(slot.startTime),
        endTime: this.toInputTime(slot.endTime),
      });
      this.nutritionValues =
        slot.nutritionValues && slot.nutritionValues.length > 0
          ? this.nutritionValueEditor.cloneValues(slot.nutritionValues)
          : this.nutritionValueEditor.createDefaultValues();
      return;
    }

    this.form.reset({
      key: defaults.key,
      title: defaults.title,
      sortOrder: defaults.sortOrder,
      startTime: this.toInputTime(defaults.startTime),
      endTime: this.toInputTime(defaults.endTime),
    });
    this.nutritionValues = this.nutritionValueEditor.cloneValues(defaults.nutritionValues);
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

}
