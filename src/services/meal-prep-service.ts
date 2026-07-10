import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateMealPrepShoppingListDto,
  CreatePreparedDishDto,
  CreatePreparedMealDto,
  PreparedDish,
  PreparedMeal,
  UpdatePreparedDishDto,
  UpdatePreparedMealDto,
} from '../interfaces/meal-prep.interface';
import { ShoppingList } from '../interfaces/shopping-list.interface';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

@Injectable({ providedIn: 'root' })
export class MealPrepService {
  private readonly http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string): void {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  findAllDishes(): Observable<PreparedDish[]> {
    return this.http.get<PreparedDish[]>(`${this.baseUrl}/meal-prep/dishes`);
  }

  createDish(dto: CreatePreparedDishDto): Observable<PreparedDish> {
    return this.http.post<PreparedDish>(`${this.baseUrl}/meal-prep/dishes`, dto);
  }

  updateDish(id: number, dto: UpdatePreparedDishDto): Observable<PreparedDish> {
    return this.http.patch<PreparedDish>(`${this.baseUrl}/meal-prep/dishes/${id}`, dto);
  }

  removeDish(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/meal-prep/dishes/${id}`);
  }

  createShoppingListFromDish(
    id: number,
    dto: CreateMealPrepShoppingListDto = {},
  ): Observable<ShoppingList> {
    return this.http.post<ShoppingList>(
      `${this.baseUrl}/meal-prep/dishes/${id}/create-shopping-list`,
      dto,
    );
  }

  findAllMeals(): Observable<PreparedMeal[]> {
    return this.http.get<PreparedMeal[]>(`${this.baseUrl}/meal-prep/meals`);
  }

  createMeal(dto: CreatePreparedMealDto): Observable<PreparedMeal> {
    return this.http.post<PreparedMeal>(`${this.baseUrl}/meal-prep/meals`, dto);
  }

  updateMeal(id: number, dto: UpdatePreparedMealDto): Observable<PreparedMeal> {
    return this.http.patch<PreparedMeal>(`${this.baseUrl}/meal-prep/meals/${id}`, dto);
  }

  removeMeal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/meal-prep/meals/${id}`);
  }

  createShoppingListFromMeal(
    id: number,
    dto: CreateMealPrepShoppingListDto = {},
  ): Observable<ShoppingList> {
    return this.http.post<ShoppingList>(
      `${this.baseUrl}/meal-prep/meals/${id}/create-shopping-list`,
      dto,
    );
  }
}
