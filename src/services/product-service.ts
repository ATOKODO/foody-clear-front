import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ProductUnitType =
  | 'Paquet'
  | 'Bouteille'
  | 'Boite'
  | 'Sachet'
  | 'Canette'
  | 'Bocal'
  | 'Unite'
  | 'Autre';

export type QuantityUnit = 'mg' | 'g' | 'kg' | 'ml' | 'l' | 'unit' | 'pack';

export type PortionUnit = 'tranche' | 'piece' | 'part' | 'bouteille' | 'portion';

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
  url?: string | null;
  memo?: string | null;
  nutritionValuesCreated?: NutritionValueCreated[];
}

export interface UpdateProductDto extends Partial<Omit<CreateProductDto, 'nutritionValuesCreated'>> {
  nutritionValuesUpdated?: NutritionValueUpdated[];
  clearCategory?: boolean;
  tagIdsToAdd?: number[];
  tagIdsToRemove?: number[];
}

export interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  category?: unknown | null;
  tags?: unknown[];
  genericProduct?: unknown | null;
  unitType: ProductUnitType;
  quantityPerUnit: number;
  quantityUnit: QuantityUnit | null;
  quantityNormalized?: number | null;
  portionCount?: number | null;
  portionUnit?: PortionUnit | null;
  portionQuantityNormalized?: number | null;
  price?: number | null;
  url?: string | null;
  memo?: string | null;
  nutritionValues?: unknown[];
  inventoryProducts?: unknown[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
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
