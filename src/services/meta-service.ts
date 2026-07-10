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
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || seenValues.has(trimmed)) {
          continue;
        }

        units.push({
          key: trimmed.toUpperCase(),
          value: trimmed,
          label: trimmed,
        });
        seenValues.add(trimmed);
        continue;
      }

      if (!value || typeof value !== 'object') {
        continue;
      }

      const raw = value as Record<string, unknown>;
      const unitValue =
        typeof raw['value'] === 'string' ? raw['value'].trim() : '';

      if (unitValue === '' || seenValues.has(unitValue)) {
        continue;
      }

      const item: QuantityUnitMeta = {
        key:
          typeof raw['key'] === 'string' && raw['key'].trim() !== ''
            ? raw['key'].trim()
            : unitValue.toUpperCase(),
        value: unitValue,
        label:
          typeof raw['label'] === 'string' && raw['label'].trim() !== ''
            ? raw['label'].trim()
            : unitValue,
      };

      if (typeof raw['dimension'] === 'string' && raw['dimension'].trim() !== '') {
        item.dimension = raw['dimension'].trim();
      }

      if (typeof raw['factor'] === 'number' && Number.isFinite(raw['factor'])) {
        item.factor = raw['factor'];
      }

      units.push(item);
      seenValues.add(unitValue);
    }

    return units;
  }

  private sanitizeNutritionKeys(values: unknown[]): NutritionKeyMeta[] {
    const keys: NutritionKeyMeta[] = [];
    const seenValues = new Set<string>();

    for (const value of values) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || seenValues.has(trimmed)) {
          continue;
        }

        keys.push({
          key: trimmed.toUpperCase(),
          value: trimmed,
          label: trimmed,
          allowedUnits: [],
        });
        seenValues.add(trimmed);
        continue;
      }

      if (!value || typeof value !== 'object') {
        continue;
      }

      const raw = value as Record<string, unknown>;
      const nutritionKeyValue =
        typeof raw['value'] === 'string' ? raw['value'].trim() : '';

      if (nutritionKeyValue === '' || seenValues.has(nutritionKeyValue)) {
        continue;
      }

      const allowedUnits = Array.isArray(raw['allowedUnits'])
        ? raw['allowedUnits']
            .filter((unit): unit is string => typeof unit === 'string')
            .map((unit) => unit.trim())
            .filter((unit) => unit !== '')
        : [];

      keys.push({
        key:
          typeof raw['key'] === 'string' && raw['key'].trim() !== ''
            ? raw['key'].trim()
            : nutritionKeyValue.toUpperCase(),
        value: nutritionKeyValue,
        label:
          typeof raw['label'] === 'string' && raw['label'].trim() !== ''
            ? raw['label'].trim()
            : nutritionKeyValue,
        allowedUnits,
      });
      seenValues.add(nutritionKeyValue);
    }

    return keys;
  }
}
