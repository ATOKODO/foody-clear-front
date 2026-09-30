import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductService } from './product-service';
import type { ProductFormNutritionValue } from '../components/product/product-form/product-form';

export interface FoodFactsProduct {
  barcode: string;
  name: string | null;
  brands: string | null;
  quantity: string | null;
  quantityPerUnit: number | null;
  quantityUnit: 'g' | 'ml' | null;
  ingredients: string | null;
  allergens: string[];
  nutriScore: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  nutritionValues: ProductFormNutritionValue[];
}

export function isProductBarcode(value: string): boolean {
  return /^(?:\d{8}|\d{12,14})$/.test(value);
}

@Injectable({ providedIn: 'root' })
export class OpenFoodFactsService {
  private readonly http = inject(HttpClient);
  private readonly products = inject(ProductService);

  lookup(barcode: string): Observable<FoodFactsProduct> {
    return this.http.get<FoodFactsProduct>(`${this.products.baseUrl}/open-food-facts/products/${encodeURIComponent(barcode)}`);
  }
}
