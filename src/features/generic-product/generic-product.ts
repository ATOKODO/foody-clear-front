import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  GenericProductService,
  CreateGenericProductDto,
  UpdateGenericProductDto,
} from '../../services/generic-product-service';
import { CommonModule, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-generic-product',
  imports:[JsonPipe, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './generic-product.html',
  styleUrl: './generic-product.scss',
})
export class GenericProduct implements OnInit {

  form: FormGroup = new FormGroup({});
  // Lie la baseUrl au service via getter/setter (évite l'erreur "used before initialization")
  get baseUrl(): string {
    return this.gpSrv.baseUrl;
  }
  set baseUrl(v: string) {
    this.gpSrv.setBaseUrl(v);
  }

  constructor(
    private fb: FormBuilder,
    private gpSrv: GenericProductService,
  ) {}
  ngOnInit(): void {
    this.form = this.fb.group({
      id: this.fb.control<number | null>(null),
      name: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      minQuantityUnit: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
      minQuantityMetric: this.fb.control<number | null>(null, {
        validators: [Validators.required],
      }),
    });
  }

  lastResponse: unknown = null;
  lastError: unknown = null;
  loading = false;

  // ----- helpers -----
  private pickCreatePayload(): CreateGenericProductDto {
    const v = this.form.getRawValue();
    if (!v.name || v.minQuantityUnit == null || v.minQuantityMetric == null) {
      throw new Error(
        'Pour CREATE : name, minQuantityUnit et minQuantityMetric sont requis.',
      );
    }
    return {
      name: v.name.trim(),
      minQuantityUnit: v.minQuantityUnit,
      minQuantityMetric: v.minQuantityMetric,
    };
  }

  private pickUpdatePayload(): UpdateGenericProductDto {
    const v = this.form.getRawValue();
    const dto: UpdateGenericProductDto = {};
    if (v.name && v.name.trim() !== '') dto.name = v.name.trim();
    if (v.minQuantityUnit != null) dto.minQuantityUnit = v.minQuantityUnit;
    if (v.minQuantityMetric != null)
      dto.minQuantityMetric = v.minQuantityMetric;
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

  // ----- actions API -----
  create() {
    this.loading = true;
    try {
      const dto = this.pickCreatePayload();
      this.gpSrv.create(dto).subscribe({
        next: (r) => this.setResult(r),
        error: (e) => this.setError(e),
      });
    } catch (e) {
      this.setError(e);
    }
  }

  getAll() {
    this.loading = true;
    this.gpSrv.findAll().subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  getOne() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError(
        'Veuillez renseigner un id pour GET /generic-products/:id',
      );
    this.loading = true;
    this.gpSrv.findOne(id).subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  update() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError(
        'Veuillez renseigner un id pour PATCH /generic-products/:id',
      );

    const dto = this.pickUpdatePayload();
    if (Object.keys(dto).length === 0)
      return this.setError('Aucun champ à mettre à jour.');

    this.loading = true;
    this.gpSrv.update(id, dto).subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  delete() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError(
        'Veuillez renseigner un id pour DELETE /generic-products/:id',
      );
    this.loading = true;
    this.gpSrv.remove(id).subscribe({
      next: () => this.setResult({ deleted: true, id }),
      error: (e) => this.setError(e),
    });
  }

  fillDemoCreate() {
    this.form.patchValue({
      id: null,
      name: 'Riz Basmati',
      minQuantityUnit: 1,
      minQuantityMetric: 500,
    });
  }

  clear() {
    this.form.reset({
      id: null,
      name: '',
      minQuantityUnit: null,
      minQuantityMetric: null,
    });
    this.lastResponse = null;
    this.lastError = null;
  }
}
