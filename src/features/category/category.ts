import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CategoryService,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../services/category-service';
import { CommonModule, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-category',
  imports: [JsonPipe, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './category.html',
  styleUrl: './category.scss',
})
export class Category implements OnInit {
  baseUrl = '';
  form: FormGroup = new FormGroup({});
  loading = false;

  // Derniers résultats (affichés dans le template)
  lastResponse: unknown = null;
  lastError: unknown = null;

  constructor(
    private fb: FormBuilder,
    private categorySrv: CategoryService,
  ) {}
  ngOnInit(): void {
    // Base URL éditable depuis l'UI
    this.baseUrl = this.categorySrv.baseUrl;

    // Un seul formulaire : id (pour get/update/delete) + champs de catégorie
    this.form = this.fb.group({
      id: this.fb.control<number | null>(null),
      name: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      warnBeforeDays: this.fb.control<number | null>(null),
      recentlyExpiredDays: this.fb.control<number | null>(null),
      minQuantity: this.fb.control<number | null>(null),
    });
  }

  onBaseUrlChange() {
    this.categorySrv.setBaseUrl(this.baseUrl);
  }

  // --- Helpers ---
  private pickCreatePayload(): CreateCategoryDto {
    const v = this.form.getRawValue();
    if (
      v.name === '' ||
      v.warnBeforeDays == null ||
      v.recentlyExpiredDays == null ||
      v.minQuantity == null
    ) {
      throw new Error(
        'Pour CREATE, tous les champs (name, warnBeforeDays, recentlyExpiredDays, minQuantity) sont requis.',
      );
    }
    return {
      name: v.name,
      warnBeforeDays: v.warnBeforeDays,
      recentlyExpiredDays: v.recentlyExpiredDays,
      minQuantity: v.minQuantity,
    };
  }

  /** PATCH partiel : n’envoie que les champs renseignés */
  private pickUpdatePayload(): UpdateCategoryDto {
    const v = this.form.getRawValue();
    const dto: UpdateCategoryDto = {};
    if (v.name && v.name.trim() !== '') dto.name = v.name.trim();
    if (v.warnBeforeDays != null) dto.warnBeforeDays = v.warnBeforeDays;
    if (v.recentlyExpiredDays != null)
      dto.recentlyExpiredDays = v.recentlyExpiredDays;
    if (v.minQuantity != null) dto.minQuantity = v.minQuantity;
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

  // --- Actions ---
  create() {
    this.loading = true;
    try {
      const dto = this.pickCreatePayload();
      this.categorySrv.create(dto).subscribe({
        next: (r) => this.setResult(r),
        error: (e) => this.setError(e),
      });
    } catch (e) {
      this.setError(e);
    }
  }

  getAll() {
    this.loading = true;
    this.categorySrv.findAll().subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  getOne() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError('Veuillez renseigner un id pour GET /:id');
    this.loading = true;
    this.categorySrv.findOne(id).subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  update() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError('Veuillez renseigner un id pour PATCH /:id');
    const dto = this.pickUpdatePayload();
    if (Object.keys(dto).length === 0)
      return this.setError('Aucun champ à mettre à jour.');
    this.loading = true;
    this.categorySrv.update(id, dto).subscribe({
      next: (r) => this.setResult(r),
      error: (e) => this.setError(e),
    });
  }

  delete() {
    const id = this.form.value.id ?? null;
    if (id == null)
      return this.setError('Veuillez renseigner un id pour DELETE /:id');
    this.loading = true;
    this.categorySrv.remove(id).subscribe({
      next: (r) => this.setResult({ deleted: true, id }),
      error: (e) => this.setError(e),
    });
  }

  fillDemoCreate() {
    this.form.patchValue({
      id: null,
      name: 'Fruits & Légumes',
      warnBeforeDays: 5,
      recentlyExpiredDays: 2,
      minQuantity: 1,
    });
  }

  clear() {
    this.form.reset({ id: null, name: '' });
    this.lastResponse = null;
    this.lastError = null;
  }
}
