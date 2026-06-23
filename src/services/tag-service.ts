import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

export interface Tag {
  id: number;
  name: string;
}

export interface CreateTagDto {
  name: string;
}

export type UpdateTagDto = Partial<CreateTagDto>;

@Injectable({ providedIn: 'root' })
export class TagService {
  private http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string) {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  create(dto: CreateTagDto): Observable<Tag> {
    return this.http.post<Tag>(`${this.baseUrl}/tag`, dto);
  }

  findAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.baseUrl}/tag`);
  }

  findOne(id: number): Observable<Tag> {
    return this.http.get<Tag>(`${this.baseUrl}/tag/${id}`);
  }

  update(id: number, dto: UpdateTagDto): Observable<Tag> {
    return this.http.patch<Tag>(`${this.baseUrl}/tag/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tag/${id}`);
  }
}
