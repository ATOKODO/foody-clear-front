import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateInventoryDto,
  Inventory,
  InventoryProduct,
  ReconcileInventoryProductsDto,
  UpdateInventoryDto,
  UpdateInventoryProductsDto,
} from '../interfaces/inventory.interface';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  create(dto: CreateInventoryDto): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.baseUrl}/inventory`, dto);
  }

  findAll(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.baseUrl}/inventory`);
  }

  findOne(id: number): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.baseUrl}/inventory/${id}`);
  }

  findProducts(id: number): Observable<InventoryProduct[]> {
    return this.http.get<InventoryProduct[]>(`${this.baseUrl}/inventory/${id}/products`);
  }

  update(id: number, dto: UpdateInventoryDto): Observable<Inventory> {
    return this.http.patch<Inventory>(`${this.baseUrl}/inventory/${id}`, dto);
  }

  addProducts(id: number, dto: UpdateInventoryProductsDto): Observable<Inventory> {
    return this.http.patch<Inventory>(`${this.baseUrl}/inventory/${id}/products/add`, dto);
  }

  removeProducts(id: number, dto: UpdateInventoryProductsDto): Observable<Inventory> {
    return this.http.patch<Inventory>(`${this.baseUrl}/inventory/${id}/products/remove`, dto);
  }

  reconcileProducts(id: number, dto: ReconcileInventoryProductsDto): Observable<Inventory> {
    return this.http.patch<Inventory>(`${this.baseUrl}/inventory/${id}/products/reconcile`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/inventory/${id}`);
  }
}
