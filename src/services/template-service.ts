import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateTemplateDto,
  CreateTemplateItemDto,
  Template,
  UpdateTemplateDto,
  UpdateTemplateItemDto,
} from '../interfaces/template.interface';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string): void {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  findAll(): Observable<Template[]> {
    return this.http.get<Template[]>(`${this.baseUrl}/template`);
  }

  findOne(id: number, compareDaySetId?: number | null): Observable<Template> {
    let params = new HttpParams();
    if (typeof compareDaySetId === 'number' && Number.isInteger(compareDaySetId) && compareDaySetId > 0) {
      params = params.set('compareDaySetId', String(compareDaySetId));
    }

    return this.http.get<Template>(`${this.baseUrl}/template/${id}`, { params });
  }

  create(dto: CreateTemplateDto): Observable<Template> {
    return this.http.post<Template>(`${this.baseUrl}/template`, dto);
  }

  update(id: number, dto: UpdateTemplateDto): Observable<Template> {
    return this.http.patch<Template>(`${this.baseUrl}/template/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/template/${id}`);
  }

  createItem(id: number, dto: CreateTemplateItemDto): Observable<Template> {
    return this.http.post<Template>(`${this.baseUrl}/template/${id}/items`, dto);
  }

  updateItem(id: number, itemId: number, dto: UpdateTemplateItemDto): Observable<Template> {
    return this.http.patch<Template>(`${this.baseUrl}/template/${id}/items/${itemId}`, dto);
  }

  removeItem(id: number, itemId: number): Observable<Template> {
    return this.http.delete<Template>(`${this.baseUrl}/template/${id}/items/${itemId}`);
  }
}
