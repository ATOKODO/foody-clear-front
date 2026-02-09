import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  NutritionValueService,
  CreateNutritionValueDto,
  UpdateNutritionValueDto,
} from '../../services/nutrition-value-service';
import { JsonPipe, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-nutrition-value',
  imports: [
    JsonPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './nutrition-value.html',
  styleUrl: './nutrition-value.scss',
})
export class NutritionValues implements OnInit {
  // Lie la baseUrl au service via getter/setter (évite "used before initialization")
  get baseUrl(): string {
    return this.nvSrv.baseUrl;
  }
  set baseUrl(v: string) {
    this.nvSrv.setBaseUrl(v);
  }
  form: FormGroup = new FormGroup({});
  lastResponse: unknown = null;
  lastError: unknown = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private nvSrv: NutritionValueService,
  ) {}
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
      productId: this.fb.control<number | null>(null), // requis pour CREATE
    });
  }

  // ---- helpers ----
  private pickCreatePayload(): CreateNutritionValueDto {
    const v = this.form.getRawValue();
    if (
      !v.label ||
      v.amount == null ||
      !v.unit ||
      v.per == null ||
      v.productId == null
    ) {
      throw new Error(
        'Pour CREATE : label, amount, unit, per, productId sont requis.',
      );
    }
    return {
      label: v.label.trim(),
      amount: v.amount,
      unit: v.unit.trim(),
      per: v.per,
      productId: v.productId,
    };
  }

  private pickUpdatePayload(): UpdateNutritionValueDto {
    const v = this.form.getRawValue();
    const dto: UpdateNutritionValueDto = {};
    if (v.label && v.label.trim() !== '') dto.label = v.label.trim();
    if (v.amount != null) dto.amount = v.amount;
    if (v.unit && v.unit.trim() !== '') dto.unit = v.unit.trim();
    if (v.per != null) dto.per = v.per;
    if (v.productId != null) dto.productId = v.productId; // si tu autorises le changement de produit
    return dto;
  }

  private setResult(resp: unknown) {
    this.lastResponse = resp;
    this.lastError = null;
    this.loading = false;
  }
  private setError(err: unknown) {
    this.lastError = err;
    this.loading = false;
  }

  // ---- actions API ----
  create() {
    this.loading = true;
    try {
      const dto = this.pickCreatePayload();
      this.nvSrv.create(dto).subscribe({
        next: (r) => this.setResult(r),
        error: (e) => this.setError(e),
      });
    } catch (e) {
      this.setError(e);
    }
  }

  getAll() {
    this.loading = true;
    this.nvSrv.findAll().subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  getOne() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError(
        'Veuillez renseigner un id pour GET /nutrition-values/:id',
      );
    this.loading = true;
    this.nvSrv.findOne(id).subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  update() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError(
        'Veuillez renseigner un id pour PATCH /nutrition-values/:id',
      );
    const dto = this.pickUpdatePayload();
    if (Object.keys(dto).length === 0)
      return this.setError('Aucun champ à mettre à jour.');
    this.loading = true;
    this.nvSrv.update(id, dto).subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  delete() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError(
        'Veuillez renseigner un id pour DELETE /nutrition-values/:id',
      );
    this.loading = true;
    this.nvSrv.remove(id).subscribe({
      next: () => this.setResult({ deleted: true, id }),
      error: (e) => this.setError(e),
    });
  }

  fillDemoCreate() {
    this.form.patchValue({
      id: null,
      label: 'Protéines',
      amount: 12.5,
      unit: 'g',
      per: 100,
      productId: 1, // adapte à ton produit
    });
  }

  clear() {
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
