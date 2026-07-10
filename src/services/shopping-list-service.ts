import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CheckAllShoppingListItemsDto,
  ConvertShoppingListItemsDto,
  CreateShoppingListDto,
  CreateShoppingListFromTemplateDto,
  CreateShoppingListItemDto,
  CreateShoppingListTemplateDto,
  ShoppingList,
  ShoppingListTemplate,
  UpdateShoppingListDto,
  UpdateShoppingListItemDto,
  UpdateShoppingListTemplateDto,
} from '../interfaces/shopping-list.interface';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private readonly http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string): void {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  findAll(): Observable<ShoppingList[]> {
    return this.http.get<ShoppingList[]>(`${this.baseUrl}/shopping-list`);
  }

  findOne(id: number): Observable<ShoppingList> {
    return this.http.get<ShoppingList>(`${this.baseUrl}/shopping-list/${id}`);
  }

  create(dto: CreateShoppingListDto): Observable<ShoppingList> {
    return this.http.post<ShoppingList>(`${this.baseUrl}/shopping-list`, dto);
  }

  update(id: number, dto: UpdateShoppingListDto): Observable<ShoppingList> {
    return this.http.patch<ShoppingList>(`${this.baseUrl}/shopping-list/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/shopping-list/${id}`);
  }

  createItem(id: number, dto: CreateShoppingListItemDto): Observable<ShoppingList> {
    return this.http.post<ShoppingList>(`${this.baseUrl}/shopping-list/${id}/items`, dto);
  }

  updateItem(id: number, itemId: number, dto: UpdateShoppingListItemDto): Observable<ShoppingList> {
    return this.http.patch<ShoppingList>(`${this.baseUrl}/shopping-list/${id}/items/${itemId}`, dto);
  }

  removeItem(id: number, itemId: number): Observable<ShoppingList | null> {
    return this.http.delete<ShoppingList | null>(`${this.baseUrl}/shopping-list/${id}/items/${itemId}`);
  }

  checkAll(id: number, dto: CheckAllShoppingListItemsDto): Observable<ShoppingList> {
    return this.http.patch<ShoppingList>(`${this.baseUrl}/shopping-list/${id}/check-all`, dto);
  }

  convertChecked(id: number, dto: ConvertShoppingListItemsDto): Observable<ShoppingList | null> {
    return this.http.post<ShoppingList | null>(`${this.baseUrl}/shopping-list/${id}/convert-checked`, dto);
  }

  saveTemplate(id: number, dto: CreateShoppingListTemplateDto): Observable<ShoppingListTemplate> {
    return this.http.post<ShoppingListTemplate>(`${this.baseUrl}/shopping-list/${id}/save-template`, dto);
  }

  findAllTemplates(): Observable<ShoppingListTemplate[]> {
    return this.http.get<ShoppingListTemplate[]>(`${this.baseUrl}/shopping-list/templates`);
  }

  createTemplate(dto: CreateShoppingListTemplateDto): Observable<ShoppingListTemplate> {
    return this.http.post<ShoppingListTemplate>(`${this.baseUrl}/shopping-list/templates`, dto);
  }

  updateTemplate(id: number, dto: UpdateShoppingListTemplateDto): Observable<ShoppingListTemplate> {
    return this.http.patch<ShoppingListTemplate>(`${this.baseUrl}/shopping-list/templates/${id}`, dto);
  }

  removeTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/shopping-list/templates/${id}`);
  }

  createFromTemplate(id: number, dto: CreateShoppingListFromTemplateDto): Observable<ShoppingList> {
    return this.http.post<ShoppingList>(`${this.baseUrl}/shopping-list/templates/${id}/create-list`, dto);
  }
}
