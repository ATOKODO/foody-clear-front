import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PortionUnit, QuantityUnit } from './product-service';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

export interface GenericProduct {
  id: number;
  name: string;
  minQuantityUnit: number;    // ex: 1 (paquet)
  minQuantityUnitType?: PortionUnit | null;
  minQuantityMetric: number;  // ex: 500 (g)
  minQuantityMetricType?: QuantityUnit | null;
}

export interface CreateGenericProductDto {
  name: string;
  minQuantityUnit: number;
  minQuantityUnitType?: PortionUnit | null;
  minQuantityMetric: number;
  minQuantityMetricType?: QuantityUnit | null;
}

export type UpdateGenericProductDto = Partial<CreateGenericProductDto>;

@Injectable({ providedIn: 'root' })
export class GenericProductService {
  private http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string) {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  create(dto: CreateGenericProductDto): Observable<GenericProduct> {
    return this.http.post<GenericProduct>(`${this.baseUrl}/generic-product`, dto);
  }

  findAll(): Observable<GenericProduct[]> {
    return this.http.get<GenericProduct[]>(`${this.baseUrl}/generic-product`);
  }

  findOne(id: number): Observable<GenericProduct> {
    return this.http.get<GenericProduct>(`${this.baseUrl}/generic-product/${id}`);
  }

  update(id: number, dto: UpdateGenericProductDto): Observable<GenericProduct> {
    return this.http.patch<GenericProduct>(`${this.baseUrl}/generic-product/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/generic-product/${id}`);
  }
}
