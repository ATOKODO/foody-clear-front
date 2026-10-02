import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';
import {
  CreateNutritionValueDto,
  NutritionValueService,
  UpdateNutritionValueDto,
} from '../../services/nutrition-value-service';

@Component({
  selector: 'app-nutrition-value',
  imports: [
    JsonPipe,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    UiErrorPanel
  ],
  templateUrl: './nutrition-value.html',
})
export class NutritionValues implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly nvSrv = inject(NutritionValueService);

  // Lie la baseUrl au service via getter/setter pour eviter "used before initialization".
  get baseUrl(): string {
    return this.nvSrv.baseUrl;
  }

  set baseUrl(value: string) {
    this.nvSrv.setBaseUrl(value);
  }

  form: FormGroup = new FormGroup({});
  private readonly responseState = signal<unknown>(null);
  private readonly errorState = signal<unknown>(null);
  private readonly loadingState = signal(false);
  get lastResponse(): unknown { return this.responseState(); }
  set lastResponse(value: unknown) { this.responseState.set(value); }
  get lastError(): unknown { return this.errorState(); }
  set lastError(value: unknown) { this.errorState.set(value); }
  get loading(): boolean { return this.loadingState(); }
  set loading(value: boolean) { this.loadingState.set(value); }
  readonly nutritionKeys = ['ENERGY_KCAL', 'ENERGY_KJ', 'FAT', 'SATURATED_FAT', 'CARBOHYDRATE', 'SUGARS', 'PROTEIN', 'FIBER', 'SALT'];
  readonly units = ['G', 'MG', 'KCAL', 'KJ'];
  readonly references = ['PER_100G', 'PER_100ML'];

  ngOnInit(): void {
    this.form = this.fb.group({
      id: this.fb.control<number | null>(null),
      nutritionKey: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      amount: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
      unit: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      reference: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
      productId: this.fb.control<number | null>(null),
    });
  }

  private pickCreatePayload(): CreateNutritionValueDto {
    const value = this.form.getRawValue();
    if (
      !value.nutritionKey ||
      value.amount == null ||
      !value.unit ||
      !this.references.includes(value.reference) ||
      !this.nutritionKeys.includes(value.nutritionKey.trim()) ||
      !this.units.includes(value.unit.trim()) ||
      !Number.isFinite(value.amount) ||
      !Number.isInteger(value.productId) || value.productId < 1
    ) {
      throw new Error('Pour CREATE : nutritionKey, amount, unit, reference, productId sont requis.');
    }

    return {
      nutritionKey: value.nutritionKey.trim(),
      amount: value.amount,
      unit: value.unit.trim(),
      reference: value.reference,
      productId: value.productId,
    };
  }

  private pickUpdatePayload(): UpdateNutritionValueDto {
    const value = this.form.getRawValue();
    const dto: UpdateNutritionValueDto = {};

    if (value.nutritionKey && value.nutritionKey.trim() !== '') dto.nutritionKey = value.nutritionKey.trim();
    if (value.amount != null) dto.amount = value.amount;
    if (value.unit && value.unit.trim() !== '') dto.unit = value.unit.trim();
    if (value.reference) dto.reference = value.reference;
    if (value.productId != null) dto.productId = value.productId;

    return dto;
  }

  private setResult(response: unknown): void {
    this.lastResponse = response;
    this.lastError = null;
    this.loading = false;
  }

  private setError(error: unknown): void {
    this.lastError = error;
    this.loading = false;
  }

  create(): void {
    if (this.loading) return;
    this.loading = true;

    try {
      const dto = this.pickCreatePayload();
      this.nvSrv.create(dto).subscribe({
        next: (response) => this.setResult(response),
        error: (error) => this.setError(error),
      });
    } catch (error) {
      this.setError(error);
    }
  }

  getAll(): void {
    if (this.loading) return;
    this.loading = true;
    this.nvSrv.findAll().subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  getOne(): void {
    if (this.loading) return;
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError('Veuillez renseigner un id pour GET /nutrition-value/:id');
      return;
    }

    this.loading = true;
    this.nvSrv.findOne(id).subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  update(): void {
    if (this.loading) return;
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError('Veuillez renseigner un id pour PATCH /nutrition-value/:id');
      return;
    }

    const dto = this.pickUpdatePayload();
    if (Object.keys(dto).length === 0) {
      this.setError('No field to update.');
      return;
    }

    this.loading = true;
    this.nvSrv.update(id, dto).subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  delete(): void {
    if (this.loading) return;
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError('Veuillez renseigner un id pour DELETE /nutrition-value/:id');
      return;
    }

    this.loading = true;
    this.nvSrv.remove(id).subscribe({
      next: () => this.setResult({ deleted: true, id }),
      error: (error) => this.setError(error),
    });
  }

  fillDemoCreate(): void {
    this.form.patchValue({
      id: null,
      nutritionKey: 'PROTEIN',
      amount: 12.5,
      unit: 'G',
      reference: 'PER_100G',
      productId: 1,
    });
  }

  clear(): void {
    this.form.reset({
      id: null,
      nutritionKey: '',
      amount: null,
      unit: '',
      reference: '',
      productId: null,
    });
    this.lastResponse = null;
    this.lastError = null;
  }
}
