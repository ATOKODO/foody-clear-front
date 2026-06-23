import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
    UiErrorPanel
],
  templateUrl: './nutrition-value.html',
  styleUrl: './nutrition-value.scss',
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
  lastResponse: unknown = null;
  lastError: unknown = null;
  loading = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      id: this.fb.control<number | null>(null),
      label: this.fb.control<string>('', {
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
      per: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
      productId: this.fb.control<number | null>(null),
    });
  }

  private pickCreatePayload(): CreateNutritionValueDto {
    const value = this.form.getRawValue();
    if (
      !value.label ||
      value.amount == null ||
      !value.unit ||
      value.per == null ||
      value.productId == null
    ) {
      throw new Error('Pour CREATE : label, amount, unit, per, productId sont requis.');
    }

    return {
      label: value.label.trim(),
      amount: value.amount,
      unit: value.unit.trim(),
      per: value.per,
      productId: value.productId,
    };
  }

  private pickUpdatePayload(): UpdateNutritionValueDto {
    const value = this.form.getRawValue();
    const dto: UpdateNutritionValueDto = {};

    if (value.label && value.label.trim() !== '') dto.label = value.label.trim();
    if (value.amount != null) dto.amount = value.amount;
    if (value.unit && value.unit.trim() !== '') dto.unit = value.unit.trim();
    if (value.per != null) dto.per = value.per;
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
    this.loading = true;
    this.nvSrv.findAll().subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  getOne(): void {
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError('Veuillez renseigner un id pour GET /nutrition-values/:id');
      return;
    }

    this.loading = true;
    this.nvSrv.findOne(id).subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  update(): void {
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError('Veuillez renseigner un id pour PATCH /nutrition-values/:id');
      return;
    }

    const dto = this.pickUpdatePayload();
    if (Object.keys(dto).length === 0) {
      this.setError('Aucun champ a mettre a jour.');
      return;
    }

    this.loading = true;
    this.nvSrv.update(id, dto).subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  delete(): void {
    const id = this.form.value.id ?? null;
    if (id == null) {
      this.setError('Veuillez renseigner un id pour DELETE /nutrition-values/:id');
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
      label: 'Proteines',
      amount: 12.5,
      unit: 'g',
      per: 100,
      productId: 1,
    });
  }

  clear(): void {
    this.form.reset({
      id: null,
      label: '',
      amount: null,
      unit: '',
      per: null,
      productId: null,
    });
    this.lastResponse = null;
    this.lastError = null;
  }
}
