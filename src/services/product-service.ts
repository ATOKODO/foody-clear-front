import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- Types côté front pour tes tests ---
export interface NutritionValueCreated {
  nutritionKey: string;
  amount: number;
  unit: string;
  reference: string;
}

export interface NutritionValueUpdated extends Partial<NutritionValueCreated> {
  id?: number; // si présent -> update ; sinon -> create
}

export interface CreateProductDto {
  name: string;
  barcode?: string | null;
  categoryId?: number | null;
  tagIds?: number[];
  genericProductId?: number | null;
  unitType: string;
  quantityPerUnit: number;
  quantityUnit: string;
  price?: number | null;
  url?: string | null;
  memo?: string | null;
  nutritionValuesCreated?: NutritionValueCreated[];
}

export interface UpdateProductDto extends Partial<
  Omit<CreateProductDto, 'nutritionValuesCreated'>
> {
  // PATCH partiel : on n’envoie que ce qu’on modifie
  nutritionValuesUpdated?: NutritionValueUpdated[];
  tagIdsToAdd?: number[];
  tagIdsToRemove?: number[];
}

export interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  category?: any | null;
  tags?: any[];
  genericProduct?: any | null;
  unitType: string;
  quantityPerUnit: number;
  quantityUnit: string | null;
  price?: number | null;
  url?: string | null;
  memo?: string | null;
  nutritionValues?: any[];
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
