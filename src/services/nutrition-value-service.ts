import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

export interface NutritionValue {
  id: number;
  label: string;
  amount: number;
  unit: string;  // ex: "g", "kcal"
  per: number;   // ex: 100
  product?: unknown;
  productId?: number;
}

export interface CreateNutritionValueDto {
  label: string;
  amount: number;
  unit: string;
  per: number;
  productId: number;
}

export type UpdateNutritionValueDto = Partial<CreateNutritionValueDto>;

@Injectable({ providedIn: 'root' })
export class NutritionValueService {
  private readonly http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string) {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  create(dto: CreateNutritionValueDto): Observable<NutritionValue> {
    return this.http.post<NutritionValue>(`${this.baseUrl}/nutrition-value`, dto);
  }

  findAll(): Observable<NutritionValue[]> {
    return this.http.get<NutritionValue[]>(`${this.baseUrl}/nutrition-value`);
  }

  findOne(id: number): Observable<NutritionValue> {
    return this.http.get<NutritionValue>(`${this.baseUrl}/nutrition-value/${id}`);
  }

  update(id: number, dto: UpdateNutritionValueDto): Observable<NutritionValue> {
    return this.http.patch<NutritionValue>(`${this.baseUrl}/nutrition-value/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/nutrition-value/${id}`);
  }
}
