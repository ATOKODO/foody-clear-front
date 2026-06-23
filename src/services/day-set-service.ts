import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateDaySetDto,
  DaySet,
  UpdateDaySetDto,
} from '../interfaces/day-set.interface';
import { defaultApiBaseUrl, normalizeApiBaseUrl } from '../utils/api-base-url';

@Injectable({
  providedIn: 'root',
})
export class DaySetService {
  private http = inject(HttpClient);

  baseUrl = defaultApiBaseUrl;

  setBaseUrl(url: string): void {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  create(dto: CreateDaySetDto): Observable<DaySet> {
    return this.http.post<DaySet>(`${this.baseUrl}/day-set`, dto);
  }

  findAll(): Observable<DaySet[]> {
    return this.http.get<DaySet[]>(`${this.baseUrl}/day-set`);
  }

  findOne(id: number): Observable<DaySet> {
    return this.http.get<DaySet>(`${this.baseUrl}/day-set/${id}`);
  }

  update(id: number, dto: UpdateDaySetDto): Observable<DaySet> {
    return this.http.patch<DaySet>(`${this.baseUrl}/day-set/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/day-set/${id}`);
  }
}
