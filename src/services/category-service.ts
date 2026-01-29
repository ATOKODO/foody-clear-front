import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  name: string;
  warnBeforeDays: number;
  recentlyExpiredDays: number;
  minQuantity: number;
}

export interface CreateCategoryDto {
  name: string;
  warnBeforeDays: number;
  recentlyExpiredDays: number;
  minQuantity: number;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

@Injectable({ providedIn: 'root' })
export class CategoryService {
  /** Modifie-la dans le composant si besoin */
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  create(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/category`, dto);
  }

  findAll(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/category`);
  }

  findOne(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseUrl}/category/${id}`);
  }

  update(id: number, dto: UpdateCategoryDto): Observable<Category> {
    return this.http.patch<Category>(`${this.baseUrl}/category/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/category/${id}`);
  }
}
