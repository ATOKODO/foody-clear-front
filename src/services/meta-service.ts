import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface QuantityUnitMeta {
  key: string;
  value: string;
  label: string;
  dimension?: string;
  factor?: number;
}

@Injectable({ providedIn: 'root' })
export class MetaService {
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getQuantityUnits(): Observable<QuantityUnitMeta[]> {
    return this.http
      .get<unknown>(`${this.baseUrl}/meta/quantity-units`)
      .pipe(map((response) => this.normalizeQuantityUnits(response)));
  }

  private normalizeQuantityUnits(response: unknown): QuantityUnitMeta[] {
    if (Array.isArray(response)) {
      return this.sanitizeUnits(response);
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const data = response as Record<string, unknown>;
    const candidateKeys = ['data', 'items', 'quantityUnits', 'units'];

    for (const key of candidateKeys) {
      const value = data[key];
      if (Array.isArray(value)) {
        return this.sanitizeUnits(value);
      }
    }

    return [];
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
}
