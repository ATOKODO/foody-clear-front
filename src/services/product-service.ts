import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

export type ProductUnitType =
  | 'Paquet'
  | 'Bouteille'
  | 'Boite'
  | 'Sachet'
  | 'Canette'
  | 'Bocal'
  | 'Unite'
  | 'Autre';

import type { QuantityUnit, PortionUnit } from '../interfaces/quantity.interface';
export type { QuantityUnit, PortionUnit } from '../interfaces/quantity.interface';
export type ProductPriceUnit =
  | 'kg'
  | 'g'
  | 'l'
  | 'ml'
  | 'unite'
  | 'paquet'
  | 'bouteille'
  | 'boite'
  | 'sachet'
  | 'canette'
  | 'bocal'
  | 'autre';

export interface NutritionValueCreated {
  id?: number;
  nutritionKey: string;
  amount: number;
  unit: string;
  reference: string;
}

export interface NutritionValueUpdated extends Partial<NutritionValueCreated> {
  id?: number;
}

export interface CreateProductDto {
  name: string;
  barcode?: string | null;
  categoryId?: number | null;
  tagIds?: number[];
  genericProductId?: number | null;
  unitType: ProductUnitType;
  quantityPerUnit: number;
  quantityUnit: QuantityUnit;
  portionCount?: number | null;
  portionUnit?: PortionUnit | null;
  portionQuantityNormalized?: number | null;
  price?: number | null;
  priceUnit?: ProductPriceUnit | null;
  url?: string | null;
  memo?: string | null;
  nutritionValuesCreated?: NutritionValueCreated[];
}

export interface UpdateProductDto extends Partial<Omit<CreateProductDto, 'nutritionValuesCreated'>> {
  nutritionValuesUpdated?: NutritionValueUpdated[];
  nutritionValueIdsToRemove?: number[];
  clearCategory?: boolean;
  tagIdsToAdd?: number[];
  tagIdsToRemove?: number[];
  priceEffectiveFrom?: string | null;
}

export interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  category?: unknown;
  tags?: unknown[];
  genericProduct?: unknown;
  unitType: ProductUnitType;
  quantityPerUnit: number;
  quantityUnit: QuantityUnit | null;
  quantityNormalized?: number | null;
  portionCount?: number | null;
  portionUnit?: PortionUnit | null;
  portionQuantityNormalized?: number | null;
  price?: number | null;
  priceUnit?: ProductPriceUnit | null;
  url?: string | null;
  memo?: string | null;
  nutritionValues?: unknown[];
  inventoryProducts?: unknown[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string) {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  create(dto: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/product`, dto);
  }

  findAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/product`);
  }

  findOne(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/product/${id}`);
  }

  update(id: number, dto: UpdateProductDto): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/product/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/product/${id}`);
  }
}
