import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

export interface QuantityUnitMeta {
  key: string;
  value: string;
  label: string;
  dimension?: string;
  factor?: number;
}

export interface NutritionKeyMeta {
  key: string;
  value: string;
  label: string;
  allowedUnits: string[];
}

@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string): void {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  getQuantityUnits(): Observable<QuantityUnitMeta[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/meta/quantity-units`)
      .pipe(map((response) => this.normalizeQuantityUnits(response)));
  }

  getNutritionKeys(): Observable<NutritionKeyMeta[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/meta/nutrition-keys`)
      .pipe(map((response) => this.normalizeNutritionKeys(response)));
  }

  private normalizeQuantityUnits(response: unknown): QuantityUnitMeta[] {
    return this.sanitizeUnits(this.findArrayPayload(response, ['data', 'items', 'quantityUnits', 'units']));
  }

  private normalizeNutritionKeys(response: unknown): NutritionKeyMeta[] {
    return this.sanitizeNutritionKeys(this.findArrayPayload(response, ['data', 'items', 'nutritionKeys', 'keys']));
  }

  private findArrayPayload(response: unknown, keys: string[]): unknown[] {
    if (Array.isArray(response)) return response;
    if (!response || typeof response !== 'object') return [];
    const data = response as Record<string, unknown>;
    return keys.map((key) => data[key]).find(Array.isArray) ?? [];
  }

  private sanitizeUnits(values: unknown[]): QuantityUnitMeta[] {
    const units: QuantityUnitMeta[] = [];
    const seenValues = new Set<string>();

    for (const value of values) {
      const item = this.normalizeUnit(value);
      if (!item || seenValues.has(item.value)) {
        continue;
      }
      units.push(item);
      seenValues.add(item.value);
    }

    return units;
  }

  private sanitizeNutritionKeys(values: unknown[]): NutritionKeyMeta[] {
    const keys: NutritionKeyMeta[] = [];
    const seenValues = new Set<string>();

    for (const value of values) {
      const item = this.normalizeNutritionKey(value);
      if (!item || seenValues.has(item.value)) {
        continue;
      }
      keys.push(item);
      seenValues.add(item.value);
    }

    return keys;
  }

  private normalizeUnit(value: unknown): QuantityUnitMeta | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? { key: trimmed.toUpperCase(), value: trimmed, label: trimmed } : null;
    }
    if (!value || typeof value !== 'object') return null;

    const raw = value as Record<string, unknown>;
    const unitValue = typeof raw['value'] === 'string' ? raw['value'].trim() : '';
    if (!unitValue) return null;

    const item: QuantityUnitMeta = {
      key: this.readTrimmedString(raw['key']) ?? unitValue.toUpperCase(),
      value: unitValue,
      label: this.readTrimmedString(raw['label']) ?? unitValue,
    };
    const dimension = this.readTrimmedString(raw['dimension']);
    if (dimension) item.dimension = dimension;
    if (typeof raw['factor'] === 'number' && Number.isFinite(raw['factor'])) item.factor = raw['factor'];
    return item;
  }

  private normalizeNutritionKey(value: unknown): NutritionKeyMeta | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? { key: trimmed.toUpperCase(), value: trimmed, label: trimmed, allowedUnits: [] } : null;
    }
    if (!value || typeof value !== 'object') return null;

    const raw = value as Record<string, unknown>;
    const keyValue = typeof raw['value'] === 'string' ? raw['value'].trim() : '';
    if (!keyValue) return null;
    const allowedUnits = Array.isArray(raw['allowedUnits'])
      ? raw['allowedUnits'].filter((unit): unit is string => typeof unit === 'string').map((unit) => unit.trim()).filter(Boolean)
      : [];
    return {
      key: this.readTrimmedString(raw['key']) ?? keyValue.toUpperCase(),
      value: keyValue,
      label: this.readTrimmedString(raw['label']) ?? keyValue,
      allowedUnits,
    };
  }

  private readTrimmedString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
