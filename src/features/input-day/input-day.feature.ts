import { CommonModule, JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputDayService } from '../../services/input-day-service';
import { InputDayItemCommand } from '../../interfaces/input-day.interface';

@Component({
  selector: 'app-input-day',
  imports: [JsonPipe, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './input-day.feature.html',
  styleUrl: './input-day.feature.scss',
})
export class InputDayFeature implements OnInit {
  baseUrl = '';
  form: FormGroup = new FormGroup({});
  loading = false;

  lastResponse: unknown = null;
  lastError: unknown = null;

  constructor(
    private fb: FormBuilder,
    private inputDaySrv: InputDayService,
  ) {}

  ngOnInit(): void {
    this.baseUrl = this.inputDaySrv.baseUrl;

    this.form = this.fb.group({
      dateLocal: this.fb.control<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      timezone: this.fb.control<string>('UTC', { nonNullable: true }),

      productId: this.fb.control<number | null>(null),
      qty: this.fb.control<number | null>(null),
      slotId: this.fb.control<number | null>(null),
      slotKey: this.fb.control<string | null>(null),

      bulkItemsJson: this.fb.control<string>('', { nonNullable: true }),

      itemId: this.fb.control<number | null>(null),
      updateQty: this.fb.control<number | null>(null),
    });
  }

  onBaseUrlChange() {
    this.inputDaySrv.setBaseUrl(this.baseUrl);
  }

  loadDay() {
    const dateLocal = this.requireDate();
    if (!dateLocal) return;

    const timezone = this.form.value.timezone ?? 'UTC';
    this.loading = true;

    this.inputDaySrv.getInputDay(dateLocal, timezone).subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  createItem() {
    const dateLocal = this.requireDate();
    if (!dateLocal) return;

    try {
      const dto = this.buildCreateItemPayload();
      this.loading = true;
      this.inputDaySrv.createItem(dateLocal, dto).subscribe({
        next: (response) => this.setResult(response),
        error: (error) => this.setError(error),
      });
    } catch (error) {
      this.setError(error);
    }
  }

  createBulk() {
    const dateLocal = this.requireDate();
    if (!dateLocal) return;

    const raw = (this.form.value.bulkItemsJson ?? '').trim();
    if (raw === '') {
      this.setError('Le JSON bulkItemsJson est requis.');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('bulkItemsJson doit etre un tableau non vide.');
      }

      const items = parsed.map((value) => this.normalizeItemPayload(value));
      this.loading = true;
      this.inputDaySrv.createItems(dateLocal, { items }).subscribe({
        next: (response) => this.setResult(response),
        error: (error) => this.setError(error),
      });
    } catch (error) {
      this.setError(error);
    }
  }

  updateQty() {
    const dateLocal = this.requireDate();
    if (!dateLocal) return;

    const itemId = this.form.value.itemId ?? null;
    const qty = this.form.value.updateQty ?? null;

    if (itemId == null || !Number.isInteger(itemId) || itemId < 1) {
      this.setError('itemId est requis et doit etre un entier > 0.');
      return;
    }

    if (qty == null || qty <= 0) {
      this.setError('updateQty est requis et doit etre > 0.');
      return;
    }

    this.loading = true;
    this.inputDaySrv.updateItemQty(dateLocal, itemId, { qty }).subscribe({
      next: (response) => this.setResult(response),
      error: (error) => this.setError(error),
    });
  }

  removeItem() {
    const dateLocal = this.requireDate();
    if (!dateLocal) return;

    const itemId = this.form.value.itemId ?? null;
    if (itemId == null || !Number.isInteger(itemId) || itemId < 1) {
      this.setError('itemId est requis et doit etre un entier > 0.');
      return;
    }

    this.loading = true;
    this.inputDaySrv.removeItem(dateLocal, itemId).subscribe({
      next: () => this.setResult({ deleted: true, itemId, dateLocal }),
      error: (error) => this.setError(error),
    });
  }

  fillDemo() {
    this.form.patchValue({
      dateLocal: '2026-02-08',
      timezone: 'Europe/Paris',
      productId: 1,
      qty: 120,
      slotId: 1,
      slotKey: null,
      itemId: 1,
      updateQty: 150,
      bulkItemsJson:
        '[{"productId":1,"qty":100,"slotId":1},{"productId":2,"qty":50,"slotId":2}]',
    });
  }

  clear() {
    this.form.reset({
      dateLocal: '',
      timezone: 'UTC',
      productId: null,
      qty: null,
      slotId: null,
      slotKey: null,
      bulkItemsJson: '',
      itemId: null,
      updateQty: null,
    });

    this.lastResponse = null;
    this.lastError = null;
  }

  private requireDate(): string | null {
    const dateLocal = (this.form.value.dateLocal ?? '').trim();
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(dateLocal)) {
      this.setError('dateLocal doit etre au format YYYY-MM-DD.');
      return null;
    }

    return dateLocal;
  }

  private buildCreateItemPayload(): InputDayItemCommand {
    const productId = this.form.value.productId ?? null;
    const qty = this.form.value.qty ?? null;

    if (productId == null || !Number.isInteger(productId) || productId < 1) {
      throw new Error('productId est requis et doit etre un entier > 0.');
    }

    if (qty == null || qty <= 0) {
      throw new Error('qty est requis et doit etre > 0.');
    }

    const dto: InputDayItemCommand = {
      productId,
      qty,
    };

    const slotId = this.form.value.slotId ?? null;
    const slotKey = (this.form.value.slotKey ?? '').trim();

    if (slotId != null) {
      if (!Number.isInteger(slotId) || slotId < 1) {
        throw new Error('slotId doit etre un entier > 0.');
      }
      dto.slotId = slotId;
    }

    if (slotKey !== '') {
      dto.slotKey = slotKey;
    }

    return dto;
  }

  private normalizeItemPayload(value: unknown): InputDayItemCommand {
    if (!value || typeof value !== 'object') {
      throw new Error('Chaque element bulk doit etre un objet valide.');
    }

    const raw = value as Record<string, unknown>;
    const productId = Number(raw['productId']);
    const qty = Number(raw['qty']);

    if (!Number.isInteger(productId) || productId < 1) {
      throw new Error('Chaque item bulk doit avoir productId entier > 0.');
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('Chaque item bulk doit avoir qty > 0.');
    }

    const dto: InputDayItemCommand = {
      productId,
      qty,
    };

    if (raw['slotId'] != null) {
      const slotId = Number(raw['slotId']);
      if (!Number.isInteger(slotId) || slotId < 1) {
        throw new Error('slotId bulk doit etre un entier > 0.');
      }
      dto.slotId = slotId;
    }

    if (raw['slotKey'] != null) {
      const slotKey = String(raw['slotKey']).trim();
      if (slotKey === '') {
        throw new Error('slotKey bulk ne peut pas etre vide.');
      }
      dto.slotKey = slotKey;
    }

    return dto;
  }

  private setResult(response: unknown) {
    this.lastResponse = response;
    this.lastError = null;
    this.loading = false;
  }

  private setError(error: unknown) {
    this.lastError = error;
    this.loading = false;
  }
}
