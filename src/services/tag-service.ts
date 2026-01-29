import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  create(dto: CreateTagDto): Observable<Tag> {
    return this.http.post<Tag>(`${this.baseUrl}/tags`, dto);
  }

  findAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.baseUrl}/tags`);
  }

  findOne(id: number): Observable<Tag> {
    return this.http.get<Tag>(`${this.baseUrl}/tags/${id}`);
  }

  update(id: number, dto: UpdateTagDto): Observable<Tag> {
    return this.http.patch<Tag>(`${this.baseUrl}/tags/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tags/${id}`);
  }
}
