import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { PortionUnit, QuantityUnit } from './product-service';

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
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
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
