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

export type CategoryFormMode = 'add' | 'edit';

export interface CategoryFormValue {
  name: string;
  warnBeforeDays: number;
  recentlyExpiredDays: number;
  minQuantity: number;
}

@Component({
  selector: 'app-category-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './category-form.html',
  styleUrl: './category-form.scss',
})
export class CategoryForm implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: CategoryFormMode = 'add';
  @Input() category: Partial<CategoryFormValue> | null = null;

  @Output() readonly submitted = new EventEmitter<{
    mode: CategoryFormMode;
    value: CategoryFormValue;
  }>();
  @Output() readonly menuClicked = new EventEmitter<void>();

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    warnBeforeDays: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    recentlyExpiredDays: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    minQuantity: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
  });

  ngOnInit(): void {
    this.applyInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['category']) {
      this.applyInputState();
    }
  }

  get heading(): string {
    return this.mode === 'edit' ? 'Modifier Categorie' : 'Ajouter Categorie';
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
    const warnBeforeDays = this.normalizeNonNegativeNumber(rawValue.warnBeforeDays);
    const recentlyExpiredDays = this.normalizeNonNegativeNumber(rawValue.recentlyExpiredDays);
    const minQuantity = this.normalizeNonNegativeNumber(rawValue.minQuantity);

    this.form.controls.name.setErrors(null);
    if (name === '') {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    if (
      warnBeforeDays == null ||
      recentlyExpiredDays == null ||
      minQuantity == null
    ) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit({
      mode: this.mode,
      value: {
        name,
        warnBeforeDays,
        recentlyExpiredDays,
        minQuantity,
      },
    });
  }

  private applyInputState(): void {
    this.form.reset({
      name: this.category?.name ?? '',
      warnBeforeDays:
        this.normalizeNonNegativeNumber(this.category?.warnBeforeDays) ?? null,
      recentlyExpiredDays:
        this.normalizeNonNegativeNumber(this.category?.recentlyExpiredDays) ?? null,
      minQuantity: this.normalizeNonNegativeNumber(this.category?.minQuantity) ?? null,
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
