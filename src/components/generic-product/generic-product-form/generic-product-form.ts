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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import type { PortionUnit, QuantityUnit } from '../../../services/product-service';

export type GenericProductFormMode = 'add' | 'edit';

export interface GenericProductFormValue {
  name: string;
  minQuantityUnit: number;
  minQuantityUnitType: PortionUnit | null;
  minQuantityMetric: number;
  minQuantityMetricType: QuantityUnit | null;
}

@Component({
  selector: 'app-generic-product-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './generic-product-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './generic-product-form.scss',
})
export class GenericProductForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: GenericProductFormMode = 'add';
  @Input() genericProduct: Partial<GenericProductFormValue> | null = null;
  @Input() showHeading = true;

  @Output() readonly submitted = new EventEmitter<{
    mode: GenericProductFormMode;
    value: GenericProductFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();

  readonly portionUnitOptions: PortionUnit[] = [
    'tranche',
    'piece',
    'part',
    'bouteille',
    'portion',
  ];
  readonly quantityUnitOptions: QuantityUnit[] = ['mg', 'g', 'kg', 'ml', 'l', 'unit', 'pack'];

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    minQuantityUnit: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    minQuantityUnitType: this.fb.control<PortionUnit | null>(null),
    minQuantityMetric: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    minQuantityMetricType: this.fb.control<QuantityUnit | null>(null),
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
    const minQuantityUnitType = this.normalizeNullablePortionUnit(rawValue.minQuantityUnitType);
    const minQuantityMetric = this.normalizeNonNegativeNumber(rawValue.minQuantityMetric);
    const minQuantityMetricType = this.normalizeNullableQuantityUnit(
      rawValue.minQuantityMetricType,
    );

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
        minQuantityUnitType,
        minQuantityMetric,
        minQuantityMetricType,
      },
    });
  }

  private applyInputState(): void {
    this.form.reset({
      name: this.genericProduct?.name ?? '',
      minQuantityUnit:
        this.normalizeNonNegativeNumber(this.genericProduct?.minQuantityUnit) ?? null,
      minQuantityUnitType:
        this.normalizeNullablePortionUnit(this.genericProduct?.minQuantityUnitType) ?? null,
      minQuantityMetric:
        this.normalizeNonNegativeNumber(this.genericProduct?.minQuantityMetric) ?? null,
      minQuantityMetricType:
        this.normalizeNullableQuantityUnit(this.genericProduct?.minQuantityMetricType) ?? null,
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

  private normalizeNullableQuantityUnit(value: unknown): QuantityUnit | null {
    if (typeof value !== 'string') {
      return null;
    }

    const candidate = value.trim();
    return this.quantityUnitOptions.includes(candidate as QuantityUnit)
      ? (candidate as QuantityUnit)
      : null;
  }

  private normalizeNullablePortionUnit(value: unknown): PortionUnit | null {
    if (typeof value !== 'string') {
      return null;
    }

    const candidate = value.trim();
    return this.portionUnitOptions.includes(candidate as PortionUnit)
      ? (candidate as PortionUnit)
      : null;
  }
}
