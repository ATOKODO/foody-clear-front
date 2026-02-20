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
import {
  InputDayItemCommand,
  InputDayMacroValue,
  InputDayResponse,
  InputDayTotalsMacrosBySlotEntry,
  ProductQuantityInputUnit,
} from '../../interfaces/input-day.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-input-day',
  imports: [
    JsonPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressBarModule,
  ],
  templateUrl: './input-day.feature.html',
  styleUrl: './input-day.feature.scss',
})
export class InputDayFeature implements OnInit {
  readonly qtyUnitOptions: ProductQuantityInputUnit[] = [
    'mg',
    'g',
    'kg',
    'ml',
    'l',
    'unit',
    'pack',
    'tranche',
    'piece',
    'part',
    'bouteille',
    'portion',
  ];

  baseUrl = '';
  form: FormGroup = new FormGroup({});
  loading = false;

  lastResponse: unknown = null;
  lastError: unknown = null;
  inputDayResponse: InputDayResponse | null = null;
  private readonly qtyUnitSet = new Set<ProductQuantityInputUnit>(this.qtyUnitOptions);
  private readonly slotTotalsMetaKeys = new Set([
    'slot',
    'targets',
    'deltaToTargets',
    'incompleteNutritionKeys',
  ]);

  constructor(
    private fb: FormBuilder,
    private inputDaySrv: InputDayService,
  ) {}

  ngOnInit(): void {
    this.baseUrl = this.inputDaySrv.baseUrl;

    this.form = this.fb.group({
      dateLocal: this.fb.control<Date | string | null>(null, {
        validators: [Validators.required],
      }),
      timezone: this.fb.control<string>('UTC', { nonNullable: true }),

      productId: this.fb.control<number | null>(null),
      inventoryId: this.fb.control<number | null>(null),
      qty: this.fb.control<number | null>(null),
      qtyUnit: this.fb.control<string | null>(null),
      slotId: this.fb.control<number | null>(null),
      slotKey: this.fb.control<string | null>(null),

      bulkItemsJson: this.fb.control<string>('', { nonNullable: true }),

      itemId: this.fb.control<number | null>(null),
      updateQty: this.fb.control<number | null>(null),
      updateQtyUnit: this.fb.control<string | null>(null),
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

    try {
      const itemId = this.form.value.itemId ?? null;
      const qty = this.form.value.updateQty ?? null;
      const qtyUnit = this.normalizeQtyUnit(this.form.value.updateQtyUnit);

      if (itemId == null || !Number.isInteger(itemId) || itemId < 1) {
        this.setError('itemId est requis et doit etre un entier > 0.');
        return;
      }

      if (qty == null || qty <= 0) {
        this.setError('updateQty est requis et doit etre > 0.');
        return;
      }

      this.loading = true;
      this.inputDaySrv.updateItemQty(dateLocal, itemId, {
        qty,
        ...(qtyUnit ? { qtyUnit } : {}),
      }).subscribe({
        next: (response) => this.setResult(response),
        error: (error) => this.setError(error),
      });
    } catch (error) {
      this.setError(error);
    }
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
      dateLocal: new Date(2026, 1, 8),
      timezone: 'Europe/Paris',
      productId: 1,
      inventoryId: 1,
      qty: 120,
      qtyUnit: 'g',
      slotId: 1,
      slotKey: null,
      itemId: 1,
      updateQty: 150,
      updateQtyUnit: 'g',
      bulkItemsJson:
        '[{"productId":1,"inventoryId":1,"qty":100,"qtyUnit":"g","slotId":1},{"productId":2,"inventoryId":1,"qty":50,"slotId":2}]',
    });
  }

  clear() {
    this.form.reset({
      dateLocal: null,
      timezone: 'UTC',
      productId: null,
      inventoryId: null,
      qty: null,
      qtyUnit: null,
      slotId: null,
      slotKey: null,
      bulkItemsJson: '',
      itemId: null,
      updateQty: null,
      updateQtyUnit: null,
    });

    this.lastResponse = null;
    this.lastError = null;
    this.inputDayResponse = null;
  }

  formatMacroValue(value: InputDayMacroValue): string {
    if (typeof value === 'number') {
      return this.formatDecimal(value);
    }

    return value;
  }

  formatNutritionAmount(value: number): string {
    return this.formatDecimal(value);
  }

  formatTime(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  hasEntries(value: Record<string, unknown> | null | undefined): boolean {
    return !!value && Object.keys(value).length > 0;
  }

  getSlotMacroEntries(
    slotTotals: InputDayTotalsMacrosBySlotEntry,
  ): Array<{ key: string; value: InputDayMacroValue }> {
    return Object.entries(slotTotals)
      .filter(
        ([key, value]) =>
          !this.slotTotalsMetaKeys.has(key) &&
          (typeof value === 'number' || value === 'donnee incomplete'),
      )
      .map(([key, value]) => ({
        key,
        value: value as InputDayMacroValue,
      }));
  }

  private requireDate(): string | null {
    const rawDate = this.form.value.dateLocal;
    const parsedDate = this.parseDateInput(rawDate);
    if (!parsedDate) {
      this.setError('dateLocal doit etre au format YYYY-MM-DD.');
      return null;
    }

    return this.formatDateLocal(parsedDate);
  }

  private buildCreateItemPayload(): InputDayItemCommand {
    const productId = this.form.value.productId ?? null;
    const inventoryId = this.form.value.inventoryId ?? null;
    const qty = this.form.value.qty ?? null;
    const qtyUnit = this.normalizeQtyUnit(this.form.value.qtyUnit);

    if (productId == null || !Number.isInteger(productId) || productId < 1) {
      throw new Error('productId est requis et doit etre un entier > 0.');
    }

    if (inventoryId == null || !Number.isInteger(inventoryId) || inventoryId < 1) {
      throw new Error('inventoryId est requis et doit etre un entier > 0.');
    }

    if (qty == null || qty <= 0) {
      throw new Error('qty est requis et doit etre > 0.');
    }

    const dto: InputDayItemCommand = {
      productId,
      inventoryId,
      qty,
      ...(qtyUnit ? { qtyUnit } : {}),
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
    const inventoryId = Number(raw['inventoryId']);
    const qty = Number(raw['qty']);
    const qtyUnit = this.normalizeQtyUnit(raw['qtyUnit']);

    if (!Number.isInteger(productId) || productId < 1) {
      throw new Error('Chaque item bulk doit avoir productId entier > 0.');
    }

    if (!Number.isInteger(inventoryId) || inventoryId < 1) {
      throw new Error('Chaque item bulk doit avoir inventoryId entier > 0.');
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('Chaque item bulk doit avoir qty > 0.');
    }

    const dto: InputDayItemCommand = {
      productId,
      inventoryId,
      qty,
      ...(qtyUnit ? { qtyUnit } : {}),
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

  private normalizeQtyUnit(value: unknown): ProductQuantityInputUnit | null {
    if (value == null) {
      return null;
    }

    const candidate = String(value).trim().toLowerCase();
    if (candidate === '') {
      return null;
    }

    if (!this.qtyUnitSet.has(candidate as ProductQuantityInputUnit)) {
      throw new Error(`qtyUnit invalide: ${candidate}`);
    }

    return candidate as ProductQuantityInputUnit;
  }

  private setResult(response: unknown) {
    this.lastResponse = response;
    this.lastError = null;
    this.inputDayResponse = this.isInputDayResponse(response) ? response : null;
    this.loading = false;
  }

  private setError(error: unknown) {
    this.lastError = error;
    this.loading = false;
  }

  private parseDateInput(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDecimal(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }

    return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
  }

  private isInputDayResponse(value: unknown): value is InputDayResponse {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const raw = value as Record<string, unknown>;
    return (
      typeof raw['dateLocal'] === 'string' &&
      typeof raw['timezone'] === 'string' &&
      Array.isArray(raw['items'])
    );
  }
}
