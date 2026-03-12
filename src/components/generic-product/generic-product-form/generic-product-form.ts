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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type GenericProductFormMode = 'add' | 'edit';

export interface GenericProductFormValue {
  name: string;
  minQuantityUnit: number;
  minQuantityMetric: number;
}

@Component({
  selector: 'app-generic-product-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './generic-product-form.html',
  styleUrl: './generic-product-form.scss',
})
export class GenericProductForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: GenericProductFormMode = 'add';
  @Input() genericProduct: Partial<GenericProductFormValue> | null = null;

  @Output() readonly submitted = new EventEmitter<{
    mode: GenericProductFormMode;
    value: GenericProductFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    minQuantityUnit: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    minQuantityMetric: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['genericProduct']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit'
      ? 'Modifier Generic Product'
      : 'Ajouter Generic Product';
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
    const name = rawValue.name.trim();
    const minQuantityUnit = this.normalizeNonNegativeNumber(rawValue.minQuantityUnit);
    const minQuantityMetric = this.normalizeNonNegativeNumber(rawValue.minQuantityMetric);

    this.form.controls.name.setErrors(null);
    if (name === '') {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    if (minQuantityUnit == null || minQuantityMetric == null) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit({
      mode: this.mode,
      value: {
        name,
        minQuantityUnit,
        minQuantityMetric,
      },
    });
  }

  private applyInputState(): void {
    this.form.reset({
      name: this.genericProduct?.name ?? '',
      minQuantityUnit:
        this.normalizeNonNegativeNumber(this.genericProduct?.minQuantityUnit) ?? null,
      minQuantityMetric:
        this.normalizeNonNegativeNumber(this.genericProduct?.minQuantityMetric) ?? null,
    });
  }

  private normalizeNonNegativeNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value >= 0 ? value : null;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    const parsedValue = Number(trimmed);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
  }
}
