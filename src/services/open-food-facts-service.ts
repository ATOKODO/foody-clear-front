import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { asRecord, mapFoodFactsProduct } from './open-food-facts.mapper';
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
  private readonly baseUrl = 'https://world.openfoodfacts.net';

  lookup(barcode: string): Observable<FoodFactsProduct> {
    if (!isProductBarcode(barcode)) {
      return throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Invalid barcode' }));
    }
    return this.http.get<unknown>(`${this.baseUrl}/api/v2/product/${barcode}.json`, {
      params: {
        fields: 'product_name,product_name_fr,brands,quantity,product_quantity,product_quantity_unit,ingredients_text,ingredients_text_fr,allergens_tags,nutrition_grades,nutriments,image_front_url',
        lc: 'fr',
      },
      headers: {
        Accept: 'application/json',
        // Public off/off credentials required by Open Food Facts' .net staging server.
        Authorization: 'Basic b2ZmOm9mZg==',
        'X-User-Agent': 'FoodyClear/1.0.0-alpha.1 (https://github.com/ATOKODO/foody-clear-front)',
      },
      timeout: 8000,
    }).pipe(map((data) => {
      const payload = asRecord(data);
      if (payload?.['status'] === 0) {
        throw new HttpErrorResponse({ status: 404, statusText: 'Product not found' });
      }
      const product = asRecord(payload?.['product']);
      if (payload?.['status'] !== 1 || !product) {
        throw new HttpErrorResponse({ status: 502, statusText: 'Invalid Open Food Facts response' });
      }
      return mapFoodFactsProduct(barcode, product);
    }));
  }
}
