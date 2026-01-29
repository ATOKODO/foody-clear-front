import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TagService, CreateTagDto, UpdateTagDto } from '../../services/tag-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tag',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tag.html',
  styleUrl: './tag.scss',
})
export class Tag implements OnInit{
  // Base URL reliée au service via getter/setter (évite l'erreur "used before initialization")
  form: FormGroup = new FormGroup({});
  get baseUrl(): string { return this.tagSrv.baseUrl; }
  set baseUrl(v: string) { this.tagSrv.setBaseUrl(v); }
  
  lastResponse: unknown = null;
  lastError: unknown = null;
  loading = false;
  constructor(private fb: FormBuilder, private tagSrv: TagService) {}
  
  ngOnInit(): void {
    this.form = this.fb.group({
    id: this.fb.control<number | null>(null),
    name: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  }

  // --- Helpers ---
  private pickCreatePayload(): CreateTagDto {
    const v = this.form.getRawValue();
    if (!v.name || v.name.trim() === '') {
      throw new Error('Pour CREATE, "name" est requis.');
    }
    return { name: v.name.trim() };
  }

  private pickUpdatePayload(): UpdateTagDto {
    const v = this.form.getRawValue();
    const dto: UpdateTagDto = {};
    if (v.name && v.name.trim() !== '') dto.name = v.name.trim();
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

  // --- Actions API ---
  create() {
    this.loading = true;
    try {
      const dto = this.pickCreatePayload();
      this.tagSrv.create(dto).subscribe({
        next: r => this.setResult(r),
        error: e => this.setError(e),
      });
    } catch (e) {
      this.setError(e);
    }
  }

  getAll() {
    this.loading = true;
    this.tagSrv.findAll().subscribe({
      next: r => this.setResult(r),
      error: e => this.setError(e),
    });
  }

  getOne() {
    const id = this.form.value.id ?? null;
    if (id == null) return this.setError('Veuillez renseigner un id pour GET /tags/:id');
    this.loading = true;
    this.tagSrv.findOne(id).subscribe({
      next: r => this.setResult(r),
      error: e => this.setError(e),
    });
  }

  update() {
    const id = this.form.value.id ?? null;
    if (id == null) return this.setError('Veuillez renseigner un id pour PATCH /tags/:id');
    const dto = this.pickUpdatePayload();
    if (Object.keys(dto).length === 0) return this.setError('Aucun champ à mettre à jour.');
    this.loading = true;
    this.tagSrv.update(id, dto).subscribe({
      next: r => this.setResult(r),
      error: e => this.setError(e),
    });
  }

  delete() {
    const id = this.form.value.id ?? null;
    if (id == null) return this.setError('Veuillez renseigner un id pour DELETE /tags/:id');
    this.loading = true;
    this.tagSrv.remove(id).subscribe({
      next: () => this.setResult({ deleted: true, id }),
      error: e => this.setError(e),
    });
  }

  fillDemoCreate() {
    this.form.patchValue({ id: null, name: 'Bio' });
  }

  clear() {
    this.form.reset({ id: null, name: '' });
    this.lastResponse = null;
    this.lastError = null;
  }
}
